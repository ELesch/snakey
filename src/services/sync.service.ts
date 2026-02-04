// Sync Service - Server-side sync processing for offline operations
import { createLogger } from '@/lib/logger'
import {
  SyncValidationError,
  SyncNotFoundError,
  SyncForbiddenError,
  SyncConflictError,
} from '@/lib/errors'
import { prisma } from '@/lib/db/client'
import { ReptileService } from './reptile.service'
import { FeedingService } from './feeding.service'
import { ShedService } from './shed.service'
import { MeasurementService } from './measurement.service'
import { EnvironmentService } from './environment.service'
import { PhotoService } from './photo.service'

const log = createLogger('SyncService')

// Re-export sync error classes for backwards compatibility
export { SyncValidationError, SyncNotFoundError, SyncForbiddenError, SyncConflictError }

// Supported table names for sync
type SyncTable =
  | 'reptiles'
  | 'feedings'
  | 'sheds'
  | 'measurements'
  | 'environmentLogs'
  | 'photos'

// Types for sync operations
export interface SyncOperation {
  operation: 'CREATE' | 'UPDATE' | 'DELETE'
  recordId: string
  payload: unknown
  clientTimestamp: number
}

export interface SyncResult {
  success: boolean
  recordId: string
  record?: unknown
  conflict?: boolean
  serverRecord?: unknown
  error?: string
  errorType?: 'VALIDATION_ERROR' | 'NOT_FOUND' | 'FORBIDDEN' | 'CONFLICT' | 'INTERNAL_ERROR'
}

export interface BatchSyncOperation {
  table: string
  operation: SyncOperation
}

export interface ChangesSinceResult {
  reptiles: unknown[]
  feedings: unknown[]
  sheds: unknown[]
  measurements: unknown[]
  environmentLogs: unknown[]
  photos: unknown[]
  serverTimestamp: number
}

export class SyncService {
  private reptileService: ReptileService
  private feedingService: FeedingService
  private shedService: ShedService
  private measurementService: MeasurementService
  private environmentService: EnvironmentService
  private photoService: PhotoService

  constructor() {
    this.reptileService = new ReptileService()
    this.feedingService = new FeedingService()
    this.shedService = new ShedService()
    this.measurementService = new MeasurementService()
    this.environmentService = new EnvironmentService()
    this.photoService = new PhotoService()
  }

  /**
   * Process a single sync operation
   */
  async processSyncOperation(
    userId: string,
    table: string,
    operation: SyncOperation
  ): Promise<SyncResult> {
    log.info(
      { userId, table, operation: operation.operation, recordId: operation.recordId },
      'Processing sync operation'
    )

    // Validate table name
    if (!this.isValidTable(table)) {
      throw new Error(`Unsupported table: ${table}`)
    }

    try {
      // For UPDATE operations, check for conflicts
      if (operation.operation === 'UPDATE') {
        const conflictResult = await this.checkForConflict(
          userId,
          table,
          operation.recordId,
          operation.clientTimestamp
        )
        if (conflictResult) {
          return conflictResult
        }
      }

      // Route to appropriate service
      const result = await this.routeOperation(userId, table, operation)
      return result
    } catch (error) {
      return this.handleSyncError(error, operation.recordId)
    }
  }

  /**
   * Process multiple sync operations in batch with concurrency limit.
   * Processes operations in batches of BATCH_SIZE to prevent overwhelming the database.
   */
  async processBatchSync(
    userId: string,
    operations: BatchSyncOperation[]
  ): Promise<SyncResult[]> {
    if (operations.length === 0) {
      return []
    }

    log.info(
      { userId, operationCount: operations.length },
      'Processing batch sync'
    )

    const BATCH_SIZE = 5
    const results: SyncResult[] = []

    for (let i = 0; i < operations.length; i += BATCH_SIZE) {
      const batch = operations.slice(i, i + BATCH_SIZE)
      const batchResults = await Promise.all(
        batch.map(({ table, operation }) =>
          this.processSyncOperation(userId, table, operation)
        )
      )
      results.push(...batchResults)
    }

    return results
  }

  /**
   * Get all changes since a given timestamp for pull sync
   */
  async getChangesSince(
    userId: string,
    since: Date
  ): Promise<ChangesSinceResult> {
    log.info({ userId, since }, 'Getting changes since timestamp')

    const [reptiles, feedings, sheds, measurements, environmentLogs, photos] =
      await Promise.all([
        prisma.reptile.findMany({
          where: {
            userId,
            updatedAt: { gte: since },
          },
        }),
        prisma.feeding.findMany({
          where: {
            reptile: { userId },
            updatedAt: { gte: since },
          },
        }),
        prisma.shed.findMany({
          where: {
            reptile: { userId },
            updatedAt: { gte: since },
          },
        }),
        prisma.measurement.findMany({
          where: {
            reptile: { userId },
            updatedAt: { gte: since },
          },
        }),
        prisma.environmentLog.findMany({
          where: {
            reptile: { userId },
            createdAt: { gte: since },
          },
        }),
        prisma.photo.findMany({
          where: {
            reptile: { userId },
            createdAt: { gte: since },
          },
        }),
      ])

    return {
      reptiles,
      feedings,
      sheds,
      measurements,
      environmentLogs,
      photos,
      serverTimestamp: Date.now(),
    }
  }

  /**
   * Validate that the table name is supported
   */
  private isValidTable(table: string): table is SyncTable {
    return [
      'reptiles',
      'feedings',
      'sheds',
      'measurements',
      'environmentLogs',
      'photos',
    ].includes(table)
  }

  /**
   * Check for conflicts using last-write-wins strategy
   * Returns a conflict result if server record is newer, null otherwise
   */
  private async checkForConflict(
    userId: string,
    table: SyncTable,
    recordId: string,
    clientTimestamp: number
  ): Promise<SyncResult | null> {
    try {
      const serverRecord = await this.getRecord(userId, table, recordId)

      if (!serverRecord) {
        return null // Record doesn't exist, no conflict
      }

      // Get server timestamp from updatedAt (or createdAt for environmentLogs)
      const recordWithTimestamp = serverRecord as { updatedAt?: Date; createdAt?: Date }
      const serverTimestamp =
        recordWithTimestamp.updatedAt?.getTime() ??
        recordWithTimestamp.createdAt?.getTime() ??
        0

      // Server wins if server timestamp is newer
      if (serverTimestamp > clientTimestamp) {
        log.info(
          { recordId, serverTimestamp, clientTimestamp },
          'Conflict detected - server record is newer'
        )
        return {
          success: false,
          recordId,
          conflict: true,
          serverRecord,
        }
      }

      return null // No conflict, proceed with update
    } catch (error) {
      // If we can't fetch the record (not found, forbidden), let the main operation handle it
      return null
    }
  }

  /**
   * Get a record by table and id for conflict checking
   */
  private async getRecord(
    userId: string,
    table: SyncTable,
    recordId: string
  ): Promise<unknown> {
    switch (table) {
      case 'reptiles':
        return this.reptileService.getById(userId, recordId)
      case 'feedings':
        return this.feedingService.getById(userId, recordId)
      case 'sheds':
        return this.shedService.getById(userId, recordId)
      case 'measurements':
        return this.measurementService.getById(userId, recordId)
      case 'environmentLogs':
        return this.environmentService.getById(userId, recordId)
      case 'photos':
        return this.photoService.getById(userId, recordId)
      default:
        return null
    }
  }

  /**
   * Route the operation to the appropriate service
   */
  private async routeOperation(
    userId: string,
    table: SyncTable,
    operation: SyncOperation
  ): Promise<SyncResult> {
    const { operation: op, recordId, payload } = operation

    switch (table) {
      case 'reptiles':
        return this.handleReptileOperation(userId, op, recordId, payload)
      case 'feedings':
        return this.handleFeedingOperation(userId, op, recordId, payload)
      case 'sheds':
        return this.handleShedOperation(userId, op, recordId, payload)
      case 'measurements':
        return this.handleMeasurementOperation(userId, op, recordId, payload)
      case 'environmentLogs':
        return this.handleEnvironmentOperation(userId, op, recordId, payload)
      case 'photos':
        return this.handlePhotoOperation(userId, op, recordId, payload)
      default:
        throw new Error(`Unsupported table: ${table}`)
    }
  }

  /**
   * Handle reptile CRUD operations
   */
  private async handleReptileOperation(
    userId: string,
    op: 'CREATE' | 'UPDATE' | 'DELETE',
    recordId: string,
    payload: unknown
  ): Promise<SyncResult> {
    switch (op) {
      case 'CREATE': {
        const record = await this.reptileService.create(userId, payload)
        return { success: true, recordId: record.id, record }
      }
      case 'UPDATE': {
        const record = await this.reptileService.update(userId, recordId, payload)
        return { success: true, recordId, record }
      }
      case 'DELETE': {
        await this.reptileService.softDelete(userId, recordId)
        return { success: true, recordId }
      }
    }
  }

  /**
   * Handle feeding CRUD operations
   */
  private async handleFeedingOperation(
    userId: string,
    op: 'CREATE' | 'UPDATE' | 'DELETE',
    recordId: string,
    payload: unknown
  ): Promise<SyncResult> {
    const payloadObj = payload as { reptileId?: string }
    const reptileId = payloadObj?.reptileId

    switch (op) {
      case 'CREATE': {
        if (!reptileId) {
          throw new SyncValidationError('reptileId is required')
        }
        const record = await this.feedingService.create(userId, reptileId, payload)
        return { success: true, recordId: record.id, record }
      }
      case 'UPDATE': {
        const record = await this.feedingService.update(userId, recordId, payload)
        return { success: true, recordId, record }
      }
      case 'DELETE': {
        await this.feedingService.delete(userId, recordId)
        return { success: true, recordId }
      }
    }
  }

  /**
   * Handle shed CRUD operations
   */
  private async handleShedOperation(
    userId: string,
    op: 'CREATE' | 'UPDATE' | 'DELETE',
    recordId: string,
    payload: unknown
  ): Promise<SyncResult> {
    const payloadObj = payload as { reptileId?: string }
    const reptileId = payloadObj?.reptileId

    switch (op) {
      case 'CREATE': {
        if (!reptileId) {
          throw new SyncValidationError('reptileId is required')
        }
        const record = await this.shedService.create(userId, reptileId, payload)
        return { success: true, recordId: record.id, record }
      }
      case 'UPDATE': {
        const record = await this.shedService.update(userId, recordId, payload)
        return { success: true, recordId, record }
      }
      case 'DELETE': {
        await this.shedService.delete(userId, recordId)
        return { success: true, recordId }
      }
    }
  }

  /**
   * Handle measurement CRUD operations
   */
  private async handleMeasurementOperation(
    userId: string,
    op: 'CREATE' | 'UPDATE' | 'DELETE',
    recordId: string,
    payload: unknown
  ): Promise<SyncResult> {
    const payloadObj = payload as { reptileId?: string }
    const reptileId = payloadObj?.reptileId

    switch (op) {
      case 'CREATE': {
        if (!reptileId) {
          throw new SyncValidationError('reptileId is required')
        }
        const record = await this.measurementService.create(userId, reptileId, payload)
        return { success: true, recordId: record.id, record }
      }
      case 'UPDATE': {
        const record = await this.measurementService.update(userId, recordId, payload)
        return { success: true, recordId, record }
      }
      case 'DELETE': {
        await this.measurementService.delete(userId, recordId)
        return { success: true, recordId }
      }
    }
  }

  /**
   * Handle environment log CRUD operations
   */
  private async handleEnvironmentOperation(
    userId: string,
    op: 'CREATE' | 'UPDATE' | 'DELETE',
    recordId: string,
    payload: unknown
  ): Promise<SyncResult> {
    const payloadObj = payload as { reptileId?: string }
    const reptileId = payloadObj?.reptileId

    switch (op) {
      case 'CREATE': {
        if (!reptileId) {
          throw new SyncValidationError('reptileId is required')
        }
        const record = await this.environmentService.create(userId, reptileId, payload)
        return { success: true, recordId: record.id, record }
      }
      case 'UPDATE': {
        const record = await this.environmentService.update(userId, recordId, payload)
        return { success: true, recordId, record }
      }
      case 'DELETE': {
        await this.environmentService.delete(userId, recordId)
        return { success: true, recordId }
      }
    }
  }

  /**
   * Handle photo CRUD operations
   */
  private async handlePhotoOperation(
    userId: string,
    op: 'CREATE' | 'UPDATE' | 'DELETE',
    recordId: string,
    payload: unknown
  ): Promise<SyncResult> {
    const payloadObj = payload as { reptileId?: string }
    const reptileId = payloadObj?.reptileId

    switch (op) {
      case 'CREATE': {
        if (!reptileId) {
          throw new SyncValidationError('reptileId is required')
        }
        const record = await this.photoService.create(userId, reptileId, payload)
        return { success: true, recordId: record.id, record }
      }
      case 'UPDATE': {
        const record = await this.photoService.update(userId, recordId, payload)
        return { success: true, recordId, record }
      }
      case 'DELETE': {
        await this.photoService.delete(userId, recordId)
        return { success: true, recordId }
      }
    }
  }

  /**
   * Handle sync errors and convert to SyncResult
   */
  private handleSyncError(error: unknown, recordId: string): SyncResult {
    // Use error.name for more robust checking that works with mocks
    const errorName = error instanceof Error ? error.name : ''
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    // Check for validation errors
    if (errorName === 'ValidationError' || errorName === 'SyncValidationError') {
      return {
        success: false,
        recordId,
        error: errorMessage,
        errorType: 'VALIDATION_ERROR',
      }
    }

    // Check for not found errors
    if (errorName === 'NotFoundError' || errorName === 'SyncNotFoundError') {
      return {
        success: false,
        recordId,
        error: errorMessage,
        errorType: 'NOT_FOUND',
      }
    }

    // Check for forbidden errors
    if (errorName === 'ForbiddenError' || errorName === 'SyncForbiddenError') {
      return {
        success: false,
        recordId,
        error: errorMessage,
        errorType: 'FORBIDDEN',
      }
    }

    // Check for conflict errors
    if (errorName === 'SyncConflictError') {
      return {
        success: false,
        recordId,
        error: errorMessage,
        errorType: 'CONFLICT',
      }
    }

    // Unknown error
    log.error({ error, recordId }, 'Unknown sync error')
    return {
      success: false,
      recordId,
      error: error instanceof Error ? error.message : 'Unknown error',
      errorType: 'INTERNAL_ERROR',
    }
  }
}

// Singleton instance
export const syncService = new SyncService()
