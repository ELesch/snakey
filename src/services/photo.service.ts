// Photo Service - Business Logic Layer
import { createLogger } from '@/lib/logger'
import { NotFoundError, ForbiddenError, ValidationError, StorageError } from '@/lib/errors'
import { createPaginationMeta, validateSchema } from '@/lib/utils'
import type { PaginatedResult } from '@/types/pagination'
import { PhotoRepository } from '@/repositories/photo.repository'
import {
  PhotoCreateSchema,
  PhotoUpdateSchema,
  UploadUrlRequestSchema,
  type PhotoQuery,
} from '@/validations/photo'
import { deletePhoto, getSignedUploadUrl } from '@/lib/supabase/storage'
import { verifyReptileOwnership, verifyRecordOwnership } from './base.service'
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

  constructor() {
    this.photoRepository = new PhotoRepository()
  }

  async list(
    userId: string,
    reptileId: string,
    query: Partial<PhotoQuery> = {}
  ): Promise<PaginatedResult<Photo>> {
    await verifyReptileOwnership(reptileId, userId)

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

    return {
      data: photos,
      meta: createPaginationMeta({ total, page, limit }),
    }
  }

  async getById(userId: string, photoId: string): Promise<Photo> {
    log.info({ userId, photoId }, 'Getting photo by id')

    const photo = await verifyRecordOwnership(
      this.photoRepository,
      photoId,
      userId,
      { entityLabel: 'Photo' }
    )

    return photo
  }

  async create(userId: string, reptileId: string, data: unknown): Promise<Photo> {
    await verifyReptileOwnership(reptileId, userId)

    const validated = validateSchema(PhotoCreateSchema, data)

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
    const existing = await verifyRecordOwnership(
      this.photoRepository,
      photoId,
      userId,
      { entityLabel: 'Photo' }
    )

    const validated = validateSchema(PhotoUpdateSchema, data)

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
    const existing = await verifyRecordOwnership(
      this.photoRepository,
      photoId,
      userId,
      { entityLabel: 'Photo', allowDeleted: true }
    )

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
    await verifyReptileOwnership(reptileId, userId)

    const { filename } = validateSchema(UploadUrlRequestSchema, data)

    // Generate unique paths
    const fileId = randomUUID()
    const ext = filename.split('.').pop() || 'jpg'
    const storagePath = `${userId}/originals/${fileId}.${ext}`
    const thumbnailPath = `${userId}/thumbnails/${fileId}.${ext}`

    log.info({ userId, reptileId, storagePath }, 'Generating upload URL')

    const uploadUrl = await getSignedUploadUrl(storagePath)

    return {
      uploadUrl,
      storagePath,
      thumbnailPath,
    }
  }
}

// Singleton instance
export const photoService = new PhotoService()
