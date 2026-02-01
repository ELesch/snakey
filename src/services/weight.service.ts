// Weight Service - Business Logic Layer
import { createLogger } from '@/lib/logger'
import { NotFoundError, ForbiddenError, ValidationError } from '@/lib/errors'
import { createPaginationMeta, validateSchema } from '@/lib/utils'
import type { PaginatedResult } from '@/types/pagination'
import { WeightRepository } from '@/repositories/weight.repository'
import {
  WeightCreateSchema,
  WeightUpdateSchema,
  type WeightQuery,
} from '@/validations/weight'
import { verifyReptileOwnership, verifyRecordOwnership } from './base.service'
import type { Weight } from '@/generated/prisma/client'

const log = createLogger('WeightService')

// Re-export error classes for backwards compatibility
export { NotFoundError, ForbiddenError, ValidationError }
export type { PaginatedResult }

export class WeightService {
  private weightRepository: WeightRepository

  constructor() {
    this.weightRepository = new WeightRepository()
  }

  async list(
    userId: string,
    reptileId: string,
    query: Partial<WeightQuery> = {}
  ): Promise<PaginatedResult<Weight>> {
    const {
      page = 1,
      limit = 20,
      sort = 'date',
      order = 'desc',
      startDate,
      endDate,
    } = query

    // Verify ownership first
    await verifyReptileOwnership(reptileId, userId)

    const skip = (page - 1) * limit
    const orderBy = { [sort]: order }

    log.info({ userId, reptileId, page, limit }, 'Listing weights')

    const [weights, total] = await Promise.all([
      this.weightRepository.findMany({
        reptileId,
        skip,
        take: limit,
        orderBy,
        startDate,
        endDate,
      }),
      this.weightRepository.count({
        reptileId,
        startDate,
        endDate,
      }),
    ])

    return {
      data: weights,
      meta: createPaginationMeta({ total, page, limit }),
    }
  }

  async getById(userId: string, id: string): Promise<Weight> {
    log.info({ userId, weightId: id }, 'Getting weight by id')

    const weight = await verifyRecordOwnership(
      this.weightRepository,
      id,
      userId,
      { entityLabel: 'Weight' }
    )
    return weight
  }

  async create(userId: string, reptileId: string, data: unknown): Promise<Weight> {
    // Verify ownership first
    await verifyReptileOwnership(reptileId, userId)

    // Validate input data
    const validated = validateSchema(WeightCreateSchema, data)

    log.info({ userId, reptileId, weight: validated.weight }, 'Creating weight')

    const weight = await this.weightRepository.create({
      ...(validated.id && { id: validated.id }),
      reptileId,
      date: validated.date,
      weight: validated.weight,
      notes: validated.notes ?? null,
    })

    log.info({ weightId: weight.id }, 'Weight created')
    return weight
  }

  async update(userId: string, id: string, data: unknown): Promise<Weight> {
    // Verify ownership
    await verifyRecordOwnership(
      this.weightRepository,
      id,
      userId,
      { entityLabel: 'Weight' }
    )

    // Validate update data
    const validated = validateSchema(WeightUpdateSchema, data)

    log.info({ userId, weightId: id }, 'Updating weight')

    const updatedWeight = await this.weightRepository.update(id, validated)

    log.info({ weightId: id }, 'Weight updated')
    return updatedWeight
  }

  async delete(userId: string, id: string): Promise<Weight> {
    // Verify ownership
    await verifyRecordOwnership(
      this.weightRepository,
      id,
      userId,
      { entityLabel: 'Weight' }
    )

    log.info({ userId, weightId: id }, 'Deleting weight')

    const deletedWeight = await this.weightRepository.delete(id)

    log.info({ weightId: id }, 'Weight deleted')
    return deletedWeight
  }
}

// Singleton instance
export const weightService = new WeightService()
