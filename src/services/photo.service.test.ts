// Photo Service Tests - TDD Red Phase
import { describe, it, expect, beforeEach, vi, Mock } from 'vitest'
import {
  PhotoService,
  NotFoundError,
  ForbiddenError,
  ValidationError,
  StorageError,
} from './photo.service'

// Mock the repository
vi.mock('@/repositories/photo.repository', () => ({
  PhotoRepository: vi.fn().mockImplementation(() => ({
    findMany: vi.fn(),
    count: vi.fn(),
    findById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    softDelete: vi.fn(),
    clearPrimaryForReptile: vi.fn(),
  })),
}))

// Mock the reptile repository for ownership checks (used by base.service)
vi.mock('@/repositories/reptile.repository', () => {
  const instance = {
    findById: vi.fn(),
  }
  return {
    ReptileRepository: vi.fn().mockImplementation(() => instance),
    reptileRepository: instance,
  }
})

// Mock Supabase storage
vi.mock('@/lib/supabase/storage', () => ({
  uploadPhoto: vi.fn(),
  deletePhoto: vi.fn(),
  getSignedUrl: vi.fn(),
}))

// Mock logger
vi.mock('@/lib/logger', () => ({
  createLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  }),
}))

describe('PhotoService', () => {
  let service: PhotoService
  let mockPhotoRepo: {
    findMany: Mock
    count: Mock
    findById: Mock
    create: Mock
    update: Mock
    softDelete: Mock
    clearPrimaryForReptile: Mock
  }
  let mockReptileRepo: {
    findById: Mock
  }
  let mockStorage: {
    uploadPhoto: Mock
    deletePhoto: Mock
    getSignedUrl: Mock
  }

  const userId = 'user-123'
  const reptileId = 'reptile-456'
  const photoId = 'photo-789'

  const mockReptile = {
    id: reptileId,
    userId,
    name: 'Monty',
    species: 'Ball Python',
    deletedAt: null,
  }

  const mockPhoto = {
    id: photoId,
    reptileId,
    storagePath: `${userId}/originals/test-photo.jpg`,
    thumbnailPath: `${userId}/thumbnails/test-photo.jpg`,
    caption: 'Test photo',
    takenAt: new Date('2025-01-15'),
    category: 'GENERAL',
    isPrimary: false,
    createdAt: new Date(),
    deletedAt: null,
  }

  beforeEach(async () => {
    vi.clearAllMocks()

    // Get mock instances
    const { uploadPhoto, deletePhoto, getSignedUrl } = await import('@/lib/supabase/storage')
    const { reptileRepository } = await import('@/repositories/reptile.repository')

    mockStorage = {
      uploadPhoto: uploadPhoto as Mock,
      deletePhoto: deletePhoto as Mock,
      getSignedUrl: getSignedUrl as Mock,
    }

    service = new PhotoService()

    // Access the mocked repositories
    mockPhotoRepo = (service as unknown as { photoRepository: typeof mockPhotoRepo }).photoRepository
    mockReptileRepo = reptileRepository as unknown as typeof mockReptileRepo
  })

  describe('list', () => {
    it('should list photos for a reptile owned by the user', async () => {
      mockReptileRepo.findById.mockResolvedValue(mockReptile)
      mockPhotoRepo.findMany.mockResolvedValue([mockPhoto])
      mockPhotoRepo.count.mockResolvedValue(1)

      const result = await service.list(userId, reptileId, {})

      expect(result.data).toHaveLength(1)
      expect(result.data[0].id).toBe(photoId)
      expect(result.meta.total).toBe(1)
    })

    it('should throw NotFoundError if reptile does not exist', async () => {
      mockReptileRepo.findById.mockResolvedValue(null)

      await expect(service.list(userId, reptileId, {})).rejects.toThrow(NotFoundError)
    })

    it('should throw ForbiddenError if user does not own the reptile', async () => {
      mockReptileRepo.findById.mockResolvedValue({ ...mockReptile, userId: 'other-user' })

      await expect(service.list(userId, reptileId, {})).rejects.toThrow(ForbiddenError)
    })

    it('should support pagination', async () => {
      mockReptileRepo.findById.mockResolvedValue(mockReptile)
      mockPhotoRepo.findMany.mockResolvedValue([mockPhoto])
      mockPhotoRepo.count.mockResolvedValue(25)

      const result = await service.list(userId, reptileId, { page: 2, limit: 10 })

      expect(result.meta.page).toBe(2)
      expect(result.meta.limit).toBe(10)
      expect(result.meta.totalPages).toBe(3)
      expect(result.meta.hasNext).toBe(true)
      expect(result.meta.hasPrev).toBe(true)
    })

    it('should filter by category', async () => {
      mockReptileRepo.findById.mockResolvedValue(mockReptile)
      mockPhotoRepo.findMany.mockResolvedValue([mockPhoto])
      mockPhotoRepo.count.mockResolvedValue(1)

      await service.list(userId, reptileId, { category: 'SHED' })

      expect(mockPhotoRepo.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          category: 'SHED',
        })
      )
    })

    it('should exclude soft-deleted photos by default', async () => {
      mockReptileRepo.findById.mockResolvedValue(mockReptile)
      mockPhotoRepo.findMany.mockResolvedValue([mockPhoto])
      mockPhotoRepo.count.mockResolvedValue(1)

      await service.list(userId, reptileId, {})

      expect(mockPhotoRepo.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          includeDeleted: false,
        })
      )
    })
  })

  describe('getById', () => {
    it('should return a photo if user owns the reptile', async () => {
      mockPhotoRepo.findById.mockResolvedValue({ ...mockPhoto, reptile: mockReptile })

      const result = await service.getById(userId, photoId)

      expect(result.id).toBe(photoId)
    })

    it('should throw NotFoundError if photo does not exist', async () => {
      mockPhotoRepo.findById.mockResolvedValue(null)

      await expect(service.getById(userId, photoId)).rejects.toThrow(NotFoundError)
    })

    it('should throw ForbiddenError if user does not own the reptile', async () => {
      mockPhotoRepo.findById.mockResolvedValue({
        ...mockPhoto,
        reptile: { ...mockReptile, userId: 'other-user' },
      })

      await expect(service.getById(userId, photoId)).rejects.toThrow(ForbiddenError)
    })

    it('should throw NotFoundError if photo is soft-deleted', async () => {
      mockPhotoRepo.findById.mockResolvedValue({
        ...mockPhoto,
        deletedAt: new Date(),
        reptile: mockReptile,
      })

      await expect(service.getById(userId, photoId)).rejects.toThrow(NotFoundError)
    })
  })

  describe('create', () => {
    const validInput = {
      storagePath: `${userId}/originals/new-photo.jpg`,
      thumbnailPath: `${userId}/thumbnails/new-photo.jpg`,
      caption: 'New photo',
      category: 'GENERAL',
      isPrimary: false,
    }

    it('should create a photo for a reptile owned by the user', async () => {
      mockReptileRepo.findById.mockResolvedValue(mockReptile)
      mockPhotoRepo.create.mockResolvedValue(mockPhoto)

      const result = await service.create(userId, reptileId, validInput)

      expect(result.id).toBe(photoId)
      expect(mockPhotoRepo.create).toHaveBeenCalled()
    })

    it('should throw NotFoundError if reptile does not exist', async () => {
      mockReptileRepo.findById.mockResolvedValue(null)

      await expect(service.create(userId, reptileId, validInput)).rejects.toThrow(NotFoundError)
    })

    it('should throw ForbiddenError if user does not own the reptile', async () => {
      mockReptileRepo.findById.mockResolvedValue({ ...mockReptile, userId: 'other-user' })

      await expect(service.create(userId, reptileId, validInput)).rejects.toThrow(ForbiddenError)
    })

    it('should throw ValidationError for invalid input', async () => {
      mockReptileRepo.findById.mockResolvedValue(mockReptile)

      const invalidInput = { storagePath: '' } // Missing required fields

      await expect(service.create(userId, reptileId, invalidInput)).rejects.toThrow(ValidationError)
    })

    it('should throw NotFoundError if reptile is deleted', async () => {
      mockReptileRepo.findById.mockResolvedValue({ ...mockReptile, deletedAt: new Date() })

      await expect(service.create(userId, reptileId, validInput)).rejects.toThrow(NotFoundError)
    })

    it('should clear other primary photos when setting as primary', async () => {
      mockReptileRepo.findById.mockResolvedValue(mockReptile)
      mockPhotoRepo.create.mockResolvedValue({ ...mockPhoto, isPrimary: true })

      await service.create(userId, reptileId, { ...validInput, isPrimary: true })

      expect(mockPhotoRepo.clearPrimaryForReptile).toHaveBeenCalledWith(reptileId)
    })
  })

  describe('update', () => {
    const updateInput = {
      caption: 'Updated caption',
      isPrimary: true,
    }

    it('should update a photo if user owns the reptile', async () => {
      mockPhotoRepo.findById.mockResolvedValue({ ...mockPhoto, reptile: mockReptile })
      mockPhotoRepo.update.mockResolvedValue({ ...mockPhoto, ...updateInput })

      const result = await service.update(userId, photoId, updateInput)

      expect(result.caption).toBe('Updated caption')
      expect(result.isPrimary).toBe(true)
    })

    it('should throw NotFoundError if photo does not exist', async () => {
      mockPhotoRepo.findById.mockResolvedValue(null)

      await expect(service.update(userId, photoId, updateInput)).rejects.toThrow(NotFoundError)
    })

    it('should throw ForbiddenError if user does not own the reptile', async () => {
      mockPhotoRepo.findById.mockResolvedValue({
        ...mockPhoto,
        reptile: { ...mockReptile, userId: 'other-user' },
      })

      await expect(service.update(userId, photoId, updateInput)).rejects.toThrow(ForbiddenError)
    })

    it('should throw ValidationError for invalid input', async () => {
      mockPhotoRepo.findById.mockResolvedValue({ ...mockPhoto, reptile: mockReptile })

      const invalidInput = { category: 'INVALID_CATEGORY' }

      await expect(service.update(userId, photoId, invalidInput)).rejects.toThrow(ValidationError)
    })

    it('should clear other primary photos when setting as primary', async () => {
      mockPhotoRepo.findById.mockResolvedValue({ ...mockPhoto, reptile: mockReptile })
      mockPhotoRepo.update.mockResolvedValue({ ...mockPhoto, isPrimary: true })

      await service.update(userId, photoId, { isPrimary: true })

      expect(mockPhotoRepo.clearPrimaryForReptile).toHaveBeenCalledWith(reptileId)
    })

    it('should throw NotFoundError if photo is soft-deleted', async () => {
      mockPhotoRepo.findById.mockResolvedValue({
        ...mockPhoto,
        deletedAt: new Date(),
        reptile: mockReptile,
      })

      await expect(service.update(userId, photoId, updateInput)).rejects.toThrow(NotFoundError)
    })
  })

  describe('delete', () => {
    it('should soft delete a photo and remove from storage if user owns the reptile', async () => {
      mockPhotoRepo.findById.mockResolvedValue({ ...mockPhoto, reptile: mockReptile })
      mockPhotoRepo.softDelete.mockResolvedValue({ ...mockPhoto, deletedAt: new Date() })
      mockStorage.deletePhoto.mockResolvedValue(undefined)

      const result = await service.delete(userId, photoId)

      expect(result.id).toBe(photoId)
      expect(mockPhotoRepo.softDelete).toHaveBeenCalledWith(photoId)
      expect(mockStorage.deletePhoto).toHaveBeenCalledWith(mockPhoto.storagePath)
    })

    it('should also delete thumbnail if it exists', async () => {
      mockPhotoRepo.findById.mockResolvedValue({ ...mockPhoto, reptile: mockReptile })
      mockPhotoRepo.softDelete.mockResolvedValue({ ...mockPhoto, deletedAt: new Date() })
      mockStorage.deletePhoto.mockResolvedValue(undefined)

      await service.delete(userId, photoId)

      expect(mockStorage.deletePhoto).toHaveBeenCalledWith(mockPhoto.thumbnailPath)
    })

    it('should throw NotFoundError if photo does not exist', async () => {
      mockPhotoRepo.findById.mockResolvedValue(null)

      await expect(service.delete(userId, photoId)).rejects.toThrow(NotFoundError)
    })

    it('should throw ForbiddenError if user does not own the reptile', async () => {
      mockPhotoRepo.findById.mockResolvedValue({
        ...mockPhoto,
        reptile: { ...mockReptile, userId: 'other-user' },
      })

      await expect(service.delete(userId, photoId)).rejects.toThrow(ForbiddenError)
    })

    it('should still soft-delete database record if storage deletion fails', async () => {
      mockPhotoRepo.findById.mockResolvedValue({ ...mockPhoto, reptile: mockReptile })
      mockPhotoRepo.softDelete.mockResolvedValue({ ...mockPhoto, deletedAt: new Date() })
      mockStorage.deletePhoto.mockRejectedValue(new Error('Storage error'))

      const result = await service.delete(userId, photoId)

      // Should still return success - we soft delete even if storage fails
      expect(result.id).toBe(photoId)
      expect(mockPhotoRepo.softDelete).toHaveBeenCalledWith(photoId)
    })
  })

  describe('getUploadUrl', () => {
    it('should generate a signed upload URL for a reptile owned by the user', async () => {
      mockReptileRepo.findById.mockResolvedValue(mockReptile)
      mockStorage.getSignedUrl.mockResolvedValue('https://storage.example.com/signed-url')

      const result = await service.getUploadUrl(userId, reptileId, {
        filename: 'test-photo.jpg',
        contentType: 'image/jpeg',
      })

      expect(result).toHaveProperty('uploadUrl')
      expect(result).toHaveProperty('storagePath')
      expect(result.storagePath).toContain(userId)
    })

    it('should throw NotFoundError if reptile does not exist', async () => {
      mockReptileRepo.findById.mockResolvedValue(null)

      await expect(
        service.getUploadUrl(userId, reptileId, {
          filename: 'test.jpg',
          contentType: 'image/jpeg',
        })
      ).rejects.toThrow(NotFoundError)
    })

    it('should throw ForbiddenError if user does not own the reptile', async () => {
      mockReptileRepo.findById.mockResolvedValue({ ...mockReptile, userId: 'other-user' })

      await expect(
        service.getUploadUrl(userId, reptileId, {
          filename: 'test.jpg',
          contentType: 'image/jpeg',
        })
      ).rejects.toThrow(ForbiddenError)
    })

    it('should throw ValidationError for invalid content type', async () => {
      mockReptileRepo.findById.mockResolvedValue(mockReptile)

      await expect(
        service.getUploadUrl(userId, reptileId, {
          filename: 'test.txt',
          contentType: 'text/plain',
        })
      ).rejects.toThrow(ValidationError)
    })

    it('should accept valid image content types', async () => {
      mockReptileRepo.findById.mockResolvedValue(mockReptile)
      mockStorage.getSignedUrl.mockResolvedValue('https://storage.example.com/signed-url')

      const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic']

      for (const contentType of validTypes) {
        const result = await service.getUploadUrl(userId, reptileId, {
          filename: 'test.jpg',
          contentType,
        })

        expect(result).toHaveProperty('uploadUrl')
      }
    })
  })
})
