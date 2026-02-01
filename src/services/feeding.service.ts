// Feeding Service - Business Logic Layer
import { createLogger } from '@/lib/logger'
import { NotFoundError, ForbiddenError, ValidationError } from '@/lib/errors'
import { createPaginationMeta, validateSchema } from '@/lib/utils'
import type { PaginatedResult } from '@/types/pagination'
import { FeedingRepository } from '@/repositories/feeding.repository'
import {
  FeedingCreateSchema,
  FeedingUpdateSchema,
  type FeedingQuery,
} from '@/validations/feeding'
import { verifyReptileOwnership, verifyRecordOwnership } from './base.service'
import type { Feeding, PreySource } from '@/generated/prisma/client'

const log = createLogger('FeedingService')

// Re-export error classes for backwards compatibility
export { NotFoundError, ForbiddenError, ValidationError }
export type { PaginatedResult }

export class FeedingService {
  private feedingRepository: FeedingRepository

  constructor() {
    this.feedingRepository = new FeedingRepository()
  }

  async list(
    userId: string,
    reptileId: string,
    query: Partial<FeedingQuery> = {}
  ): Promise<PaginatedResult<Feeding>> {
    // Verify ownership first
    await verifyReptileOwnership(reptileId, userId)

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

    return {
      data: feedings,
      meta: createPaginationMeta({ total, page, limit }),
    }
  }

  async getById(userId: string, feedingId: string): Promise<Feeding> {
    log.info({ userId, feedingId }, 'Getting feeding by id')

    const feeding = await verifyRecordOwnership(
      this.feedingRepository,
      feedingId,
      userId,
      { entityLabel: 'Feeding' }
    )

    return feeding
  }

  async create(userId: string, reptileId: string, data: unknown): Promise<Feeding> {
    // Verify ownership first
    await verifyReptileOwnership(reptileId, userId)

    // Validate input data
    const validated = validateSchema(FeedingCreateSchema, data)

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
    // Verify ownership first
    await verifyRecordOwnership(
      this.feedingRepository,
      feedingId,
      userId,
      { entityLabel: 'Feeding' }
    )

    // Validate update data
    const validated = validateSchema(FeedingUpdateSchema, data)

    log.info({ userId, feedingId }, 'Updating feeding')

    const updatedFeeding = await this.feedingRepository.update(feedingId, validated)

    log.info({ feedingId }, 'Feeding updated')
    return updatedFeeding
  }

  async delete(userId: string, feedingId: string): Promise<{ id: string }> {
    // Verify ownership first
    await verifyRecordOwnership(
      this.feedingRepository,
      feedingId,
      userId,
      { entityLabel: 'Feeding' }
    )

    log.info({ userId, feedingId }, 'Deleting feeding')

    const deletedFeeding = await this.feedingRepository.delete(feedingId)

    log.info({ feedingId }, 'Feeding deleted')
    return { id: deletedFeeding.id }
  }
}

// Singleton instance
export const feedingService = new FeedingService()
