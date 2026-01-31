// Photo Service - Business Logic Layer
import { createLogger } from '@/lib/logger'
import { NotFoundError, ForbiddenError, ValidationError, StorageError } from '@/lib/errors'
import type { PaginatedResult } from '@/types/pagination'
import { PhotoRepository } from '@/repositories/photo.repository'
import { ReptileRepository } from '@/repositories/reptile.repository'
import {
  PhotoCreateSchema,
  PhotoUpdateSchema,
  UploadUrlRequestSchema,
  type PhotoQuery,
} from '@/validations/photo'
import { deletePhoto, getSignedUrl } from '@/lib/supabase/storage'
import type { Photo, PhotoCategory } from '@/generated/prisma/client'
import { randomUUID } from 'crypto'

const log = createLogger('PhotoService')

// Re-export error classes for backwards compatibility
export { NotFoundError, ForbiddenError, ValidationError, StorageError }
export type { PaginatedResult }

export interface UploadUrlResult {
  uploadUrl: string
  storagePath: string
  thumbnailPath: string
}

export class PhotoService {
  private photoRepository: PhotoRepository
  private reptileRepository: ReptileRepository

  constructor() {
    this.photoRepository = new PhotoRepository()
    this.reptileRepository = new ReptileRepository()
  }

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
    query: Partial<PhotoQuery> = {}
  ): Promise<PaginatedResult<Photo>> {
    await this.verifyReptileOwnership(userId, reptileId)

    const {
      page = 1,
      limit = 20,
      sort = 'takenAt',
      order = 'desc',
      category,
      shedId,
      vetVisitId,
    } = query

    const skip = (page - 1) * limit
    const orderBy = { [sort]: order }

    log.info({ userId, reptileId, page, limit }, 'Listing photos')

    const [photos, total] = await Promise.all([
      this.photoRepository.findMany({
        reptileId,
        skip,
        take: limit,
        orderBy,
        category: category as PhotoCategory | undefined,
        shedId,
        vetVisitId,
        includeDeleted: false,
      }),
      this.photoRepository.count({
        reptileId,
        category: category as PhotoCategory | undefined,
        shedId,
        vetVisitId,
        includeDeleted: false,
      }),
    ])

    const totalPages = Math.ceil(total / limit)

    return {
      data: photos,
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

  async getById(userId: string, photoId: string): Promise<Photo> {
    log.info({ userId, photoId }, 'Getting photo by id')

    const photo = await this.photoRepository.findById(photoId, {
      includeReptile: true,
    })

    if (!photo) {
      log.warn({ photoId }, 'Photo not found')
      throw new NotFoundError('Photo not found')
    }

    if (!photo.reptile || photo.reptile.userId !== userId) {
      log.warn({ userId, photoId }, 'Access denied to photo')
      throw new ForbiddenError('Access denied')
    }

    if (photo.deletedAt) {
      log.warn({ photoId }, 'Photo is deleted')
      throw new NotFoundError('Photo not found')
    }

    return photo
  }

  async create(userId: string, reptileId: string, data: unknown): Promise<Photo> {
    await this.verifyReptileOwnership(userId, reptileId)

    const validationResult = PhotoCreateSchema.safeParse(data)

    if (!validationResult.success) {
      const issues = validationResult.error.issues
      const errorMessage = issues[0]?.message || 'Validation failed'
      log.warn({ reptileId, errors: issues }, 'Validation failed')
      throw new ValidationError(errorMessage)
    }

    const validated = validationResult.data

    log.info({ userId, reptileId, category: validated.category }, 'Creating photo')

    // Clear other primary photos if setting this one as primary
    if (validated.isPrimary) {
      await this.photoRepository.clearPrimaryForReptile(reptileId)
    }

    const photo = await this.photoRepository.create({
      ...(validated.id && { id: validated.id }),
      reptileId,
      storagePath: validated.storagePath,
      thumbnailPath: validated.thumbnailPath,
      caption: validated.caption,
      takenAt: validated.takenAt,
      category: validated.category as PhotoCategory,
      isPrimary: validated.isPrimary,
      shedId: validated.shedId,
      vetVisitId: validated.vetVisitId,
    })

    log.info({ photoId: photo.id }, 'Photo created')
    return photo
  }

  async update(userId: string, photoId: string, data: unknown): Promise<Photo> {
    const existing = await this.photoRepository.findById(photoId, {
      includeReptile: true,
    })

    if (!existing) {
      log.warn({ photoId }, 'Photo not found for update')
      throw new NotFoundError('Photo not found')
    }

    if (!existing.reptile || existing.reptile.userId !== userId) {
      log.warn({ userId, photoId }, 'Access denied for update')
      throw new ForbiddenError('Access denied')
    }

    if (existing.deletedAt) {
      log.warn({ photoId }, 'Photo is deleted')
      throw new NotFoundError('Photo not found')
    }

    const validationResult = PhotoUpdateSchema.safeParse(data)

    if (!validationResult.success) {
      const issues = validationResult.error.issues
      const errorMessage = issues[0]?.message || 'Validation failed'
      log.warn({ photoId, errors: issues }, 'Validation failed')
      throw new ValidationError(errorMessage)
    }

    const validated = validationResult.data

    log.info({ userId, photoId }, 'Updating photo')

    // Clear other primary photos if setting this one as primary
    if (validated.isPrimary) {
      await this.photoRepository.clearPrimaryForReptile(existing.reptileId)
    }

    const updatedPhoto = await this.photoRepository.update(photoId, validated)

    log.info({ photoId }, 'Photo updated')
    return updatedPhoto
  }

  async delete(userId: string, photoId: string): Promise<{ id: string }> {
    const existing = await this.photoRepository.findById(photoId, {
      includeReptile: true,
    })

    if (!existing) {
      log.warn({ photoId }, 'Photo not found for delete')
      throw new NotFoundError('Photo not found')
    }

    if (!existing.reptile || existing.reptile.userId !== userId) {
      log.warn({ userId, photoId }, 'Access denied for delete')
      throw new ForbiddenError('Access denied')
    }

    log.info({ userId, photoId }, 'Deleting photo')

    // Soft delete in database first
    const deletedPhoto = await this.photoRepository.softDelete(photoId)

    // Try to delete from storage (best effort - don't fail if storage fails)
    try {
      await deletePhoto(existing.storagePath)
      if (existing.thumbnailPath) {
        await deletePhoto(existing.thumbnailPath)
      }
    } catch (error) {
      log.warn({ photoId, error }, 'Failed to delete from storage')
      // Continue - database is already soft-deleted
    }

    log.info({ photoId }, 'Photo deleted')
    return { id: deletedPhoto.id }
  }

  async getUploadUrl(
    userId: string,
    reptileId: string,
    data: unknown
  ): Promise<UploadUrlResult> {
    await this.verifyReptileOwnership(userId, reptileId)

    const validationResult = UploadUrlRequestSchema.safeParse(data)

    if (!validationResult.success) {
      const issues = validationResult.error.issues
      const errorMessage = issues[0]?.message || 'Validation failed'
      log.warn({ reptileId, errors: issues }, 'Validation failed')
      throw new ValidationError(errorMessage)
    }

    const { filename } = validationResult.data

    // Generate unique paths
    const fileId = randomUUID()
    const ext = filename.split('.').pop() || 'jpg'
    const storagePath = `${userId}/originals/${fileId}.${ext}`
    const thumbnailPath = `${userId}/thumbnails/${fileId}.${ext}`

    log.info({ userId, reptileId, storagePath }, 'Generating upload URL')

    const uploadUrl = await getSignedUrl(storagePath, 3600)

    return {
      uploadUrl,
      storagePath,
      thumbnailPath,
    }
  }
}

// Singleton instance
export const photoService = new PhotoService()
