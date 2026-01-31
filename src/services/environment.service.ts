// Environment Service - Business Logic Layer
import { createLogger } from '@/lib/logger'
import { NotFoundError, ForbiddenError, ValidationError } from '@/lib/errors'
import type { PaginatedResult } from '@/types/pagination'
import { EnvironmentRepository } from '@/repositories/environment.repository'
import { ReptileRepository } from '@/repositories/reptile.repository'
import {
  EnvironmentCreateSchema,
  EnvironmentUpdateSchema,
  type EnvironmentQuery,
} from '@/validations/environment'
import { isTemperatureSafe, isHumiditySafe } from '@/lib/species/defaults'
import type { EnvironmentLog } from '@/generated/prisma/client'

const log = createLogger('EnvironmentService')

// Re-export error classes for backwards compatibility
export { NotFoundError, ForbiddenError, ValidationError }
export type { PaginatedResult }

export class EnvironmentService {
  private repository: EnvironmentRepository
  private reptileRepository: ReptileRepository

  constructor() {
    this.repository = new EnvironmentRepository()
    this.reptileRepository = new ReptileRepository()
  }

  async list(
    userId: string,
    reptileId: string,
    query: Partial<EnvironmentQuery> = {}
  ): Promise<PaginatedResult<EnvironmentLog>> {
    // Verify reptile ownership
    const reptile = await this.reptileRepository.findById(reptileId)

    if (!reptile) {
      log.warn({ reptileId }, 'Reptile not found')
      throw new NotFoundError('Reptile not found')
    }

    if (reptile.userId !== userId) {
      log.warn({ userId, reptileId }, 'Access denied to reptile')
      throw new ForbiddenError('Access denied')
    }

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

    const totalPages = Math.ceil(total / limit)

    return {
      data: logs,
      meta: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    }
  }

  async getById(userId: string, id: string): Promise<EnvironmentLog> {
    log.info({ userId, logId: id }, 'Getting environment log by id')

    const envLog = await this.repository.findById(id)

    if (!envLog) {
      log.warn({ logId: id }, 'Environment log not found')
      throw new NotFoundError('Environment log not found')
    }

    // Verify ownership through reptile
    const reptile = await this.reptileRepository.findById(envLog.reptileId)

    if (!reptile || reptile.userId !== userId) {
      log.warn({ userId, logId: id }, 'Access denied to environment log')
      throw new ForbiddenError('Access denied')
    }

    return envLog
  }

  async create(userId: string, reptileId: string, data: unknown): Promise<EnvironmentLog> {
    // Verify reptile ownership
    const reptile = await this.reptileRepository.findById(reptileId)

    if (!reptile) {
      log.warn({ reptileId }, 'Reptile not found')
      throw new NotFoundError('Reptile not found')
    }

    if (reptile.userId !== userId) {
      log.warn({ userId, reptileId }, 'Access denied to reptile')
      throw new ForbiddenError('Access denied')
    }

    // Validate input data
    const validationResult = EnvironmentCreateSchema.safeParse(data)

    if (!validationResult.success) {
      const issues = validationResult.error.issues
      const errorMessage = issues[0]?.message || 'Validation failed'
      log.warn({ reptileId, errors: issues }, 'Validation failed')
      throw new ValidationError(errorMessage)
    }

    const validated = validationResult.data

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
    // First verify existence
    const existing = await this.repository.findById(id)

    if (!existing) {
      log.warn({ logId: id }, 'Environment log not found for update')
      throw new NotFoundError('Environment log not found')
    }

    // Verify ownership through reptile
    const reptile = await this.reptileRepository.findById(existing.reptileId)

    if (!reptile || reptile.userId !== userId) {
      log.warn({ userId, logId: id }, 'Access denied for update')
      throw new ForbiddenError('Access denied')
    }

    // Validate update data
    const validationResult = EnvironmentUpdateSchema.safeParse(data)

    if (!validationResult.success) {
      const issues = validationResult.error.issues
      const errorMessage = issues[0]?.message || 'Validation failed'
      log.warn({ logId: id, errors: issues }, 'Validation failed')
      throw new ValidationError(errorMessage)
    }

    const validated = validationResult.data

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
    // First verify existence
    const existing = await this.repository.findById(id)

    if (!existing) {
      log.warn({ logId: id }, 'Environment log not found for delete')
      throw new NotFoundError('Environment log not found')
    }

    // Verify ownership through reptile
    const reptile = await this.reptileRepository.findById(existing.reptileId)

    if (!reptile || reptile.userId !== userId) {
      log.warn({ userId, logId: id }, 'Access denied for delete')
      throw new ForbiddenError('Access denied')
    }

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
