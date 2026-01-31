// Shed Service - Business Logic Layer
import { createLogger } from '@/lib/logger'
import { NotFoundError, ForbiddenError, ValidationError } from '@/lib/errors'
import type { PaginatedResult } from '@/types/pagination'
import { ShedRepository } from '@/repositories/shed.repository'
import { ReptileRepository } from '@/repositories/reptile.repository'
import {
  ShedCreateSchema,
  ShedUpdateSchema,
  type ShedQuery,
} from '@/validations/shed'
import type { Shed, ShedQuality } from '@/generated/prisma/client'

const log = createLogger('ShedService')

// Re-export error classes for backwards compatibility
export { NotFoundError, ForbiddenError, ValidationError }
export type { PaginatedResult }

export class ShedService {
  private shedRepository: ShedRepository
  private reptileRepository: ReptileRepository

  constructor() {
    this.shedRepository = new ShedRepository()
    this.reptileRepository = new ReptileRepository()
  }

  /**
   * Verify reptile exists and user has access
   */
  private async verifyReptileAccess(
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

  /**
   * Verify shed exists and user has access via reptile ownership
   */
  private async verifyShedAccess(
    userId: string,
    shedId: string
  ): Promise<Shed> {
    const shed = await this.shedRepository.findById(shedId, {
      include: { reptile: true },
    })

    if (!shed) {
      log.warn({ shedId }, 'Shed not found')
      throw new NotFoundError('Shed not found')
    }

    const reptile = await this.reptileRepository.findById(shed.reptileId)

    if (!reptile || reptile.userId !== userId) {
      log.warn({ userId, shedId }, 'Access denied to shed')
      throw new ForbiddenError('Access denied')
    }

    return shed
  }

  async list(
    userId: string,
    reptileId: string,
    query: Partial<ShedQuery> = {}
  ): Promise<PaginatedResult<Shed>> {
    const {
      page = 1,
      limit = 20,
      sort = 'completedDate',
      order = 'desc',
      quality,
      startAfter,
      endBefore,
    } = query

    // Verify reptile access first
    await this.verifyReptileAccess(userId, reptileId)

    const skip = (page - 1) * limit
    const orderBy = { [sort]: order }

    log.info({ userId, reptileId, page, limit }, 'Listing sheds')

    const [sheds, total] = await Promise.all([
      this.shedRepository.findMany({
        reptileId,
        skip,
        take: limit,
        orderBy,
        quality: quality as ShedQuality | undefined,
        startAfter,
        endBefore,
      }),
      this.shedRepository.count({
        reptileId,
        quality: quality as ShedQuality | undefined,
        startAfter,
        endBefore,
      }),
    ])

    const totalPages = Math.ceil(total / limit)

    return {
      data: sheds,
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

  async getById(userId: string, shedId: string): Promise<Shed> {
    log.info({ userId, shedId }, 'Getting shed by id')

    const shed = await this.verifyShedAccess(userId, shedId)
    return shed
  }

  async create(userId: string, reptileId: string, data: unknown): Promise<Shed> {
    // Verify reptile access first
    await this.verifyReptileAccess(userId, reptileId)

    // Validate input data
    const validationResult = ShedCreateSchema.safeParse(data)

    if (!validationResult.success) {
      const issues = validationResult.error.issues
      const errorMessage = issues[0]?.message || 'Validation failed'
      log.warn({ reptileId, errors: issues }, 'Validation failed')
      throw new ValidationError(errorMessage)
    }

    const validated = validationResult.data

    log.info(
      { userId, reptileId, quality: validated.quality },
      'Creating shed'
    )

    const shed = await this.shedRepository.create({
      ...(validated.id && { id: validated.id }),
      reptileId,
      startDate: validated.startDate ?? null,
      completedDate: validated.completedDate,
      quality: validated.quality,
      isComplete: validated.isComplete,
      issues: validated.issues ?? null,
      notes: validated.notes ?? null,
    })

    log.info({ shedId: shed.id }, 'Shed created')
    return shed
  }

  async update(userId: string, shedId: string, data: unknown): Promise<Shed> {
    // Verify shed access
    await this.verifyShedAccess(userId, shedId)

    // Validate update data
    const validationResult = ShedUpdateSchema.safeParse(data)

    if (!validationResult.success) {
      const issues = validationResult.error.issues
      const errorMessage = issues[0]?.message || 'Validation failed'
      log.warn({ shedId, errors: issues }, 'Validation failed')
      throw new ValidationError(errorMessage)
    }

    const validated = validationResult.data

    log.info({ userId, shedId }, 'Updating shed')

    const updatedShed = await this.shedRepository.update(shedId, validated)

    log.info({ shedId }, 'Shed updated')
    return updatedShed
  }

  async delete(
    userId: string,
    shedId: string
  ): Promise<{ id: string; deletedAt: Date }> {
    // Verify shed access
    await this.verifyShedAccess(userId, shedId)

    log.info({ userId, shedId }, 'Deleting shed')

    const deletedShed = await this.shedRepository.softDelete(shedId)

    log.info({ shedId }, 'Shed deleted')
    return { id: deletedShed.id, deletedAt: new Date() }
  }
}

// Singleton instance
export const shedService = new ShedService()
