// Environment Service - Business Logic Layer
import { createLogger } from '@/lib/logger'
import { NotFoundError, ForbiddenError, ValidationError } from '@/lib/errors'
import { createPaginationMeta, validateSchema } from '@/lib/utils'
import type { PaginatedResult } from '@/types/pagination'
import { EnvironmentRepository } from '@/repositories/environment.repository'
import {
  EnvironmentCreateSchema,
  EnvironmentUpdateSchema,
  type EnvironmentQuery,
} from '@/validations/environment'
import { isTemperatureSafe, isHumiditySafe } from '@/lib/species/defaults'
import { verifyReptileOwnership, verifyRecordOwnership } from './base.service'
import type { EnvironmentLog } from '@/generated/prisma/client'

const log = createLogger('EnvironmentService')

// Re-export error classes for backwards compatibility
export { NotFoundError, ForbiddenError, ValidationError }
export type { PaginatedResult }

export class EnvironmentService {
  private repository: EnvironmentRepository

  constructor() {
    this.repository = new EnvironmentRepository()
  }

  async list(
    userId: string,
    reptileId: string,
    query: Partial<EnvironmentQuery> = {}
  ): Promise<PaginatedResult<EnvironmentLog>> {
    // Verify reptile ownership
    await verifyReptileOwnership(reptileId, userId)

    const {
      page = 1,
      limit = 20,
      sort = 'date',
      order = 'desc',
      startDate,
      endDate,
      location,
      alertsOnly = false,
    } = query

    const skip = (page - 1) * limit
    const orderBy = { [sort]: order }

    log.info({ userId, reptileId, page, limit }, 'Listing environment logs')

    const [logs, total] = await Promise.all([
      this.repository.findMany({
        reptileId,
        skip,
        take: limit,
        orderBy,
        startDate,
        endDate,
        location,
        alertsOnly,
      }),
      this.repository.count({
        reptileId,
        startDate,
        endDate,
        location,
        alertsOnly,
      }),
    ])

    return {
      data: logs,
      meta: createPaginationMeta({ total, page, limit }),
    }
  }

  async getById(userId: string, id: string): Promise<EnvironmentLog> {
    log.info({ userId, logId: id }, 'Getting environment log by id')

    const envLog = await verifyRecordOwnership(
      this.repository,
      id,
      userId,
      { entityLabel: 'Environment log' }
    )

    return envLog
  }

  async create(userId: string, reptileId: string, data: unknown): Promise<EnvironmentLog> {
    // Verify reptile ownership
    const reptile = await verifyReptileOwnership(reptileId, userId)

    // Validate input data
    const validated = validateSchema(EnvironmentCreateSchema, data)

    // Determine if this reading should trigger an alert
    const isAlert = this.shouldAlert(
      reptile.species,
      validated.temperature ?? null,
      validated.humidity ?? null,
      validated.location ?? null
    )

    log.info({ userId, reptileId, isAlert }, 'Creating environment log')

    const envLog = await this.repository.create({
      ...(validated.id && { id: validated.id }),
      reptileId,
      date: validated.date,
      temperature: validated.temperature ?? null,
      humidity: validated.humidity ?? null,
      location: validated.location ?? null,
      notes: validated.notes ?? null,
      isAlert,
    })

    log.info({ logId: envLog.id, isAlert }, 'Environment log created')
    return envLog
  }

  async update(userId: string, id: string, data: unknown): Promise<EnvironmentLog> {
    // Verify ownership and get existing record
    const existing = await verifyRecordOwnership(
      this.repository,
      id,
      userId,
      { entityLabel: 'Environment log' }
    )

    // Get reptile for species info (needed for alert calculation)
    const reptile = await verifyReptileOwnership(existing.reptileId, userId)

    // Validate update data
    const validated = validateSchema(EnvironmentUpdateSchema, data)

    // Recalculate alert status with merged data
    const newTemp = validated.temperature !== undefined ? validated.temperature : existing.temperature
    const newHumidity = validated.humidity !== undefined ? validated.humidity : existing.humidity
    const newLocation = validated.location !== undefined ? validated.location : existing.location

    const isAlert = this.shouldAlert(
      reptile.species,
      newTemp ? Number(newTemp) : null,
      newHumidity ? Number(newHumidity) : null,
      newLocation
    )

    log.info({ userId, logId: id, isAlert }, 'Updating environment log')

    const updatedLog = await this.repository.update(id, {
      ...validated,
      isAlert,
    })

    log.info({ logId: id }, 'Environment log updated')
    return updatedLog
  }

  async delete(userId: string, id: string): Promise<{ id: string }> {
    // Verify ownership
    await verifyRecordOwnership(
      this.repository,
      id,
      userId,
      { entityLabel: 'Environment log' }
    )

    log.info({ userId, logId: id }, 'Deleting environment log')

    await this.repository.delete(id)

    log.info({ logId: id }, 'Environment log deleted')
    return { id }
  }

  /**
   * Determine if readings are outside safe ranges for the species
   */
  private shouldAlert(
    species: string,
    temperature: number | null,
    humidity: number | null,
    location: string | null
  ): boolean {
    // Check temperature if provided
    if (temperature !== null && location) {
      const tempLocation = location === 'cool_side' ? 'cool' : 'hot'
      if (!isTemperatureSafe(species, temperature, tempLocation)) {
        return true
      }
    }

    // Check humidity if provided
    if (humidity !== null) {
      if (!isHumiditySafe(species, humidity)) {
        return true
      }
    }

    return false
  }
}

// Singleton instance
export const environmentService = new EnvironmentService()
