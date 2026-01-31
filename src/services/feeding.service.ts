// Feeding Service - Business Logic Layer
import { createLogger } from '@/lib/logger'
import { NotFoundError, ForbiddenError, ValidationError } from '@/lib/errors'
import type { PaginatedResult } from '@/types/pagination'
import { FeedingRepository } from '@/repositories/feeding.repository'
import { ReptileRepository } from '@/repositories/reptile.repository'
import {
  FeedingCreateSchema,
  FeedingUpdateSchema,
  type FeedingQuery,
} from '@/validations/feeding'
import type { Feeding, PreySource } from '@/generated/prisma/client'

const log = createLogger('FeedingService')

// Re-export error classes for backwards compatibility
export { NotFoundError, ForbiddenError, ValidationError }
export type { PaginatedResult }

export class FeedingService {
  private feedingRepository: FeedingRepository
  private reptileRepository: ReptileRepository

  constructor() {
    this.feedingRepository = new FeedingRepository()
    this.reptileRepository = new ReptileRepository()
  }

  /**
   * Verify user owns the reptile and it's not deleted
   */
  private async verifyReptileOwnership(
    userId: string,
    reptileId: string
  ): Promise<void> {
    const reptile = await this.reptileRepository.findById(reptileId)

    if (!reptile) {
      log.warn({ reptileId }, 'Reptile not found')
      throw new NotFoundError('Reptile not found')
    }

    if (reptile.userId !== userId) {
      log.warn({ userId, reptileId }, 'Access denied to reptile')
      throw new ForbiddenError('Access denied')
    }

    if (reptile.deletedAt) {
      log.warn({ reptileId }, 'Reptile is deleted')
      throw new NotFoundError('Reptile not found')
    }
  }

  async list(
    userId: string,
    reptileId: string,
    query: Partial<FeedingQuery> = {}
  ): Promise<PaginatedResult<Feeding>> {
    // Verify ownership first
    await this.verifyReptileOwnership(userId, reptileId)

    const {
      page = 1,
      limit = 20,
      sort = 'date',
      order = 'desc',
      startDate,
      endDate,
      preyType,
      accepted,
    } = query

    const skip = (page - 1) * limit
    const orderBy = { [sort]: order }

    log.info({ userId, reptileId, page, limit }, 'Listing feedings')

    const [feedings, total] = await Promise.all([
      this.feedingRepository.findMany({
        reptileId,
        skip,
        take: limit,
        orderBy,
        startDate,
        endDate,
        preyType,
        accepted,
      }),
      this.feedingRepository.count({
        reptileId,
        startDate,
        endDate,
        preyType,
        accepted,
      }),
    ])

    const totalPages = Math.ceil(total / limit)

    return {
      data: feedings,
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

  async getById(userId: string, feedingId: string): Promise<Feeding> {
    log.info({ userId, feedingId }, 'Getting feeding by id')

    const feeding = await this.feedingRepository.findById(feedingId, {
      includeReptile: true,
    })

    if (!feeding) {
      log.warn({ feedingId }, 'Feeding not found')
      throw new NotFoundError('Feeding not found')
    }

    // Check ownership via the reptile relation
    if (!feeding.reptile || feeding.reptile.userId !== userId) {
      log.warn({ userId, feedingId }, 'Access denied to feeding')
      throw new ForbiddenError('Access denied')
    }

    return feeding
  }

  async create(userId: string, reptileId: string, data: unknown): Promise<Feeding> {
    // Verify ownership first
    await this.verifyReptileOwnership(userId, reptileId)

    // Validate input data
    const validationResult = FeedingCreateSchema.safeParse(data)

    if (!validationResult.success) {
      const issues = validationResult.error.issues
      const errorMessage = issues[0]?.message || 'Validation failed'
      log.warn({ reptileId, errors: issues }, 'Validation failed')
      throw new ValidationError(errorMessage)
    }

    const validated = validationResult.data

    log.info(
      { userId, reptileId, preyType: validated.preyType },
      'Creating feeding'
    )

    const feeding = await this.feedingRepository.create({
      ...(validated.id && { id: validated.id }),
      reptileId,
      date: validated.date,
      preyType: validated.preyType,
      preySize: validated.preySize,
      preySource: validated.preySource as PreySource,
      accepted: validated.accepted,
      refused: validated.refused,
      regurgitated: validated.regurgitated,
      notes: validated.notes,
    })

    log.info({ feedingId: feeding.id }, 'Feeding created')
    return feeding
  }

  async update(userId: string, feedingId: string, data: unknown): Promise<Feeding> {
    // First get the feeding with its reptile to check ownership
    const existing = await this.feedingRepository.findById(feedingId, {
      includeReptile: true,
    })

    if (!existing) {
      log.warn({ feedingId }, 'Feeding not found for update')
      throw new NotFoundError('Feeding not found')
    }

    if (!existing.reptile || existing.reptile.userId !== userId) {
      log.warn({ userId, feedingId }, 'Access denied for update')
      throw new ForbiddenError('Access denied')
    }

    // Validate update data
    const validationResult = FeedingUpdateSchema.safeParse(data)

    if (!validationResult.success) {
      const issues = validationResult.error.issues
      const errorMessage = issues[0]?.message || 'Validation failed'
      log.warn({ feedingId, errors: issues }, 'Validation failed')
      throw new ValidationError(errorMessage)
    }

    const validated = validationResult.data

    log.info({ userId, feedingId }, 'Updating feeding')

    const updatedFeeding = await this.feedingRepository.update(feedingId, validated)

    log.info({ feedingId }, 'Feeding updated')
    return updatedFeeding
  }

  async delete(userId: string, feedingId: string): Promise<{ id: string }> {
    // First get the feeding with its reptile to check ownership
    const existing = await this.feedingRepository.findById(feedingId, {
      includeReptile: true,
    })

    if (!existing) {
      log.warn({ feedingId }, 'Feeding not found for delete')
      throw new NotFoundError('Feeding not found')
    }

    if (!existing.reptile || existing.reptile.userId !== userId) {
      log.warn({ userId, feedingId }, 'Access denied for delete')
      throw new ForbiddenError('Access denied')
    }

    log.info({ userId, feedingId }, 'Deleting feeding')

    const deletedFeeding = await this.feedingRepository.delete(feedingId)

    log.info({ feedingId }, 'Feeding deleted')
    return { id: deletedFeeding.id }
  }
}

// Singleton instance
export const feedingService = new FeedingService()
