// Shed Service - Business Logic Layer
import { createLogger } from '@/lib/logger'
import { NotFoundError, ForbiddenError, ValidationError } from '@/lib/errors'
import { createPaginationMeta, validateSchema } from '@/lib/utils'
import type { PaginatedResult } from '@/types/pagination'
import { ShedRepository } from '@/repositories/shed.repository'
import {
  ShedCreateSchema,
  ShedUpdateSchema,
  type ShedQuery,
} from '@/validations/shed'
import { verifyReptileOwnership, verifyRecordOwnership } from './base.service'
import type { Shed, ShedQuality } from '@/generated/prisma/client'

const log = createLogger('ShedService')

// Re-export error classes for backwards compatibility
export { NotFoundError, ForbiddenError, ValidationError }
export type { PaginatedResult }

export class ShedService {
  private shedRepository: ShedRepository

  constructor() {
    this.shedRepository = new ShedRepository()
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
    await verifyReptileOwnership(reptileId, userId)

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

    return {
      data: sheds,
      meta: createPaginationMeta({ total, page, limit }),
    }
  }

  async getById(userId: string, shedId: string): Promise<Shed> {
    log.info({ userId, shedId }, 'Getting shed by id')

    const shed = await verifyRecordOwnership(
      this.shedRepository,
      shedId,
      userId,
      { entityLabel: 'Shed' }
    )
    return shed
  }

  async create(userId: string, reptileId: string, data: unknown): Promise<Shed> {
    // Verify reptile access first
    await verifyReptileOwnership(reptileId, userId)

    // Validate input data
    const validated = validateSchema(ShedCreateSchema, data)

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
    await verifyRecordOwnership(
      this.shedRepository,
      shedId,
      userId,
      { entityLabel: 'Shed' }
    )

    // Validate update data
    const validated = validateSchema(ShedUpdateSchema, data)

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
    await verifyRecordOwnership(
      this.shedRepository,
      shedId,
      userId,
      { entityLabel: 'Shed' }
    )

    log.info({ userId, shedId }, 'Deleting shed')

    const deletedShed = await this.shedRepository.softDelete(shedId)

    log.info({ shedId }, 'Shed deleted')
    return { id: deletedShed.id, deletedAt: new Date() }
  }
}

// Singleton instance
export const shedService = new ShedService()
