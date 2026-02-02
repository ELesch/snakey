// Reptile Service - Business Logic Layer
import { createLogger } from '@/lib/logger'
import { NotFoundError, ForbiddenError, ValidationError } from '@/lib/errors'
import { createPaginationMeta, validateSchema } from '@/lib/utils'
import type { PaginatedResult } from '@/types/pagination'
import type { ReptileWithProfilePhoto } from '@/types/reptile'
import {
  ReptileRepository,
  type FindByIdOptions,
} from '@/repositories/reptile.repository'
import {
  ReptileCreateSchema,
  ReptileUpdateSchema,
  type ReptileQuery,
} from '@/validations/reptile'
import type { Reptile, Sex } from '@/generated/prisma/client'

const log = createLogger('ReptileService')

// Re-export error classes for backwards compatibility
export { NotFoundError, ForbiddenError, ValidationError }
export type { PaginatedResult }

export interface GetByIdOptions {
  shareId?: string
  include?: FindByIdOptions['include']
}

export class ReptileService {
  private repository: ReptileRepository

  constructor() {
    this.repository = new ReptileRepository()
  }

  async list(
    userId: string,
    query: Partial<ReptileQuery> = {}
  ): Promise<PaginatedResult<ReptileWithProfilePhoto>> {
    const {
      page = 1,
      limit = 20,
      sort = 'createdAt',
      order = 'desc',
      species,
      sex,
      search,
      includeDeleted = false,
    } = query

    const skip = (page - 1) * limit
    const orderBy = { [sort]: order }

    log.info({ userId, page, limit, sort, order }, 'Listing reptiles')

    const [reptiles, total] = await Promise.all([
      this.repository.findMany({
        userId,
        skip,
        take: limit,
        orderBy,
        species,
        sex: sex as Sex | undefined,
        search,
        includeDeleted,
        includeProfilePhoto: true,
      }),
      this.repository.count({
        userId,
        species,
        sex: sex as Sex | undefined,
        search,
        includeDeleted,
      }),
    ])

    return {
      data: reptiles as ReptileWithProfilePhoto[],
      meta: createPaginationMeta({ total, page, limit }),
    }
  }

  async getById(
    userId: string,
    id: string,
    options: GetByIdOptions = {}
  ): Promise<Reptile> {
    const { shareId, include } = options

    log.info({ userId, reptileId: id }, 'Getting reptile by id')

    const reptile = await this.repository.findById(id, include ? { include } : undefined)

    if (!reptile) {
      log.warn({ reptileId: id }, 'Reptile not found')
      throw new NotFoundError('Reptile not found')
    }

    // Check ownership or public access
    if (reptile.userId !== userId) {
      // Allow access if reptile is public and shareId matches
      if (reptile.isPublic && reptile.shareId && reptile.shareId === shareId) {
        return reptile
      }
      log.warn({ userId, reptileId: id }, 'Access denied to reptile')
      throw new ForbiddenError('Access denied')
    }

    return reptile
  }

  async create(userId: string, data: unknown): Promise<Reptile> {
    // Validate input data
    const validated = validateSchema(ReptileCreateSchema, data)

    log.info({ userId, species: validated.species, name: validated.name }, 'Creating reptile')

    const reptile = await this.repository.create({
      ...(validated.id && { id: validated.id }),
      userId,
      name: validated.name,
      species: validated.species,
      morph: validated.morph ?? null,
      sex: validated.sex,
      birthDate: validated.birthDate ?? null,
      acquisitionDate: validated.acquisitionDate,
      currentWeight: validated.currentWeight ?? null,
      notes: validated.notes ?? null,
      isPublic: validated.isPublic,
    })

    log.info({ reptileId: reptile.id }, 'Reptile created')
    return reptile
  }

  async update(userId: string, id: string, data: unknown): Promise<Reptile> {
    // First verify ownership and existence
    const existing = await this.repository.findById(id)

    if (!existing) {
      log.warn({ reptileId: id }, 'Reptile not found for update')
      throw new NotFoundError('Reptile not found')
    }

    if (existing.userId !== userId) {
      log.warn({ userId, reptileId: id }, 'Access denied for update')
      throw new ForbiddenError('Access denied')
    }

    if (existing.deletedAt) {
      log.warn({ reptileId: id }, 'Cannot update deleted reptile')
      throw new NotFoundError('Reptile not found')
    }

    // Validate update data
    const validated = validateSchema(ReptileUpdateSchema, data)

    log.info({ userId, reptileId: id }, 'Updating reptile')

    const updatedReptile = await this.repository.update(id, validated)

    log.info({ reptileId: id }, 'Reptile updated')
    return updatedReptile
  }

  async softDelete(userId: string, id: string): Promise<{ id: string; deletedAt: Date }> {
    // Verify ownership and existence
    const existing = await this.repository.findById(id)

    if (!existing) {
      log.warn({ reptileId: id }, 'Reptile not found for delete')
      throw new NotFoundError('Reptile not found')
    }

    if (existing.userId !== userId) {
      log.warn({ userId, reptileId: id }, 'Access denied for delete')
      throw new ForbiddenError('Access denied')
    }

    if (existing.deletedAt) {
      log.warn({ reptileId: id }, 'Reptile already deleted')
      throw new NotFoundError('Reptile not found')
    }

    log.info({ userId, reptileId: id }, 'Soft deleting reptile')

    const deletedReptile = await this.repository.softDelete(id)

    log.info({ reptileId: id }, 'Reptile soft deleted')
    return { id: deletedReptile.id, deletedAt: deletedReptile.deletedAt! }
  }

  async restore(userId: string, id: string): Promise<Reptile> {
    // Verify ownership and existence
    const existing = await this.repository.findById(id)

    if (!existing) {
      log.warn({ reptileId: id }, 'Reptile not found for restore')
      throw new NotFoundError('Reptile not found')
    }

    if (existing.userId !== userId) {
      log.warn({ userId, reptileId: id }, 'Access denied for restore')
      throw new ForbiddenError('Access denied')
    }

    if (!existing.deletedAt) {
      log.warn({ reptileId: id }, 'Reptile is not deleted')
      throw new ValidationError('Reptile is not deleted')
    }

    log.info({ userId, reptileId: id }, 'Restoring reptile')

    const restoredReptile = await this.repository.restore(id)

    log.info({ reptileId: id }, 'Reptile restored')
    return restoredReptile
  }
}

// Singleton instance
export const reptileService = new ReptileService()
