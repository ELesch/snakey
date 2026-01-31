// Weight Service - Business Logic Layer
import { createLogger } from '@/lib/logger'
import { NotFoundError, ForbiddenError, ValidationError } from '@/lib/errors'
import type { PaginatedResult } from '@/types/pagination'
import { WeightRepository } from '@/repositories/weight.repository'
import { ReptileRepository } from '@/repositories/reptile.repository'
import {
  WeightCreateSchema,
  WeightUpdateSchema,
  type WeightQuery,
} from '@/validations/weight'
import type { Weight } from '@/generated/prisma/client'

const log = createLogger('WeightService')

// Re-export error classes for backwards compatibility
export { NotFoundError, ForbiddenError, ValidationError }
export type { PaginatedResult }

export class WeightService {
  private weightRepository: WeightRepository
  private reptileRepository: ReptileRepository

  constructor() {
    this.weightRepository = new WeightRepository()
    this.reptileRepository = new ReptileRepository()
  }

  /**
   * Verify the user owns the reptile
   */
  private async verifyReptileOwnership(userId: string, reptileId: string) {
    const reptile = await this.reptileRepository.findById(reptileId)

    if (!reptile) {
      log.warn({ reptileId }, 'Reptile not found')
      throw new NotFoundError('Reptile not found')
    }

    if (reptile.userId !== userId) {
      log.warn({ userId, reptileId }, 'Access denied to reptile')
      throw new ForbiddenError('Access denied')
    }

    return reptile
  }

  /**
   * Verify the user owns the weight record (via reptile ownership)
   */
  private async verifyWeightOwnership(userId: string, weightId: string) {
    const weight = await this.weightRepository.findById(weightId)

    if (!weight) {
      log.warn({ weightId }, 'Weight not found')
      throw new NotFoundError('Weight not found')
    }

    await this.verifyReptileOwnership(userId, weight.reptileId)

    return weight
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
    await this.verifyReptileOwnership(userId, reptileId)

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

    const totalPages = Math.ceil(total / limit)

    return {
      data: weights,
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

  async getById(userId: string, id: string): Promise<Weight> {
    log.info({ userId, weightId: id }, 'Getting weight by id')

    const weight = await this.verifyWeightOwnership(userId, id)
    return weight
  }

  async create(userId: string, reptileId: string, data: unknown): Promise<Weight> {
    // Verify ownership first
    await this.verifyReptileOwnership(userId, reptileId)

    // Validate input data
    const validationResult = WeightCreateSchema.safeParse(data)

    if (!validationResult.success) {
      const issues = validationResult.error.issues
      const errorMessage = issues[0]?.message || 'Validation failed'
      log.warn({ reptileId, errors: issues }, 'Validation failed')
      throw new ValidationError(errorMessage)
    }

    const validated = validationResult.data

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
    await this.verifyWeightOwnership(userId, id)

    // Validate update data
    const validationResult = WeightUpdateSchema.safeParse(data)

    if (!validationResult.success) {
      const issues = validationResult.error.issues
      const errorMessage = issues[0]?.message || 'Validation failed'
      log.warn({ weightId: id, errors: issues }, 'Validation failed')
      throw new ValidationError(errorMessage)
    }

    const validated = validationResult.data

    log.info({ userId, weightId: id }, 'Updating weight')

    const updatedWeight = await this.weightRepository.update(id, validated)

    log.info({ weightId: id }, 'Weight updated')
    return updatedWeight
  }

  async delete(userId: string, id: string): Promise<Weight> {
    // Verify ownership
    await this.verifyWeightOwnership(userId, id)

    log.info({ userId, weightId: id }, 'Deleting weight')

    const deletedWeight = await this.weightRepository.delete(id)

    log.info({ weightId: id }, 'Weight deleted')
    return deletedWeight
  }
}

// Singleton instance
export const weightService = new WeightService()
