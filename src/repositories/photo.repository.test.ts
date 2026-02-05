// Photo Repository Tests
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { PhotoRepository } from './photo.repository'
import { prisma } from '@/lib/db/client'
import type { Photo, PhotoCategory } from '@/generated/prisma/client'

// Mock the prisma client
vi.mock('@/lib/db/client', () => ({
  prisma: {
    photo: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      count: vi.fn(),
    },
  },
}))

// Mock photo for testing
const mockPhoto: Photo = {
  id: 'clphoto123456789',
  reptileId: 'clreptile123456',
  storagePath: 'photos/user-123/reptile-abc/photo1.jpg',
  thumbnailPath: 'photos/user-123/reptile-abc/photo1_thumb.jpg',
  caption: 'Luna basking',
  takenAt: new Date('2024-01-15'),
  category: 'GENERAL' as PhotoCategory,
  isPrimary: false,
  shedId: null,
  vetVisitId: null,
  createdAt: new Date('2024-01-15'),
  deletedAt: null,
}

const mockPrimaryPhoto: Photo = {
  ...mockPhoto,
  id: 'clphoto123456790',
  isPrimary: true,
  caption: 'Profile photo',
}

const mockDeletedPhoto: Photo = {
  ...mockPhoto,
  id: 'clphoto123456791',
  deletedAt: new Date('2024-01-20'),
}

const mockShedPhoto: Photo = {
  ...mockPhoto,
  id: 'clphoto123456792',
  category: 'SHED' as PhotoCategory,
  shedId: 'clshed123456789',
}

describe('PhotoRepository', () => {
  let repository: PhotoRepository

  beforeEach(() => {
    vi.clearAllMocks()
    repository = new PhotoRepository()
  })

  describe('findMany', () => {
    it('should return photos for a reptile with default options', async () => {
      vi.mocked(prisma.photo.findMany).mockResolvedValue([mockPhoto])

      const result = await repository.findMany({ reptileId: 'clreptile123456' })

      expect(result).toEqual([mockPhoto])
      expect(prisma.photo.findMany).toHaveBeenCalledWith({
        where: {
          reptileId: 'clreptile123456',
          deletedAt: null,
        },
        skip: 0,
        take: 20,
        orderBy: { takenAt: 'desc' },
      })
    })

    it('should apply pagination options', async () => {
      vi.mocked(prisma.photo.findMany).mockResolvedValue([mockPhoto])

      await repository.findMany({ reptileId: 'clreptile123456', skip: 10, take: 5 })

      expect(prisma.photo.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10,
          take: 5,
        })
      )
    })

    it('should apply custom orderBy', async () => {
      vi.mocked(prisma.photo.findMany).mockResolvedValue([mockPhoto])

      await repository.findMany({
        reptileId: 'clreptile123456',
        orderBy: { createdAt: 'asc' },
      })

      expect(prisma.photo.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { createdAt: 'asc' },
        })
      )
    })

    it('should filter by category', async () => {
      vi.mocked(prisma.photo.findMany).mockResolvedValue([mockShedPhoto])

      await repository.findMany({ reptileId: 'clreptile123456', category: 'SHED' })

      expect(prisma.photo.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            category: 'SHED',
          }),
        })
      )
    })

    it('should filter by shedId', async () => {
      vi.mocked(prisma.photo.findMany).mockResolvedValue([mockShedPhoto])

      await repository.findMany({ reptileId: 'clreptile123456', shedId: 'clshed123456789' })

      expect(prisma.photo.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            shedId: 'clshed123456789',
          }),
        })
      )
    })

    it('should filter by vetVisitId', async () => {
      vi.mocked(prisma.photo.findMany).mockResolvedValue([mockPhoto])

      await repository.findMany({ reptileId: 'clreptile123456', vetVisitId: 'clvet123456789' })

      expect(prisma.photo.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            vetVisitId: 'clvet123456789',
          }),
        })
      )
    })

    it('should exclude deleted photos by default', async () => {
      vi.mocked(prisma.photo.findMany).mockResolvedValue([mockPhoto])

      await repository.findMany({ reptileId: 'clreptile123456' })

      expect(prisma.photo.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            deletedAt: null,
          }),
        })
      )
    })

    it('should include deleted photos when requested', async () => {
      vi.mocked(prisma.photo.findMany).mockResolvedValue([mockPhoto, mockDeletedPhoto])

      await repository.findMany({ reptileId: 'clreptile123456', includeDeleted: true })

      expect(prisma.photo.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            reptileId: 'clreptile123456',
          },
        })
      )
    })

    it('should combine multiple filters', async () => {
      vi.mocked(prisma.photo.findMany).mockResolvedValue([mockShedPhoto])

      await repository.findMany({
        reptileId: 'clreptile123456',
        category: 'SHED',
        shedId: 'clshed123456789',
      })

      expect(prisma.photo.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            reptileId: 'clreptile123456',
            deletedAt: null,
            category: 'SHED',
            shedId: 'clshed123456789',
          },
        })
      )
    })
  })

  describe('count', () => {
    it('should return count for a reptile', async () => {
      vi.mocked(prisma.photo.count).mockResolvedValue(15)

      const result = await repository.count({ reptileId: 'clreptile123456' })

      expect(result).toBe(15)
      expect(prisma.photo.count).toHaveBeenCalledWith({
        where: {
          reptileId: 'clreptile123456',
          deletedAt: null,
        },
      })
    })

    it('should count with category filter', async () => {
      vi.mocked(prisma.photo.count).mockResolvedValue(5)

      await repository.count({ reptileId: 'clreptile123456', category: 'SHED' })

      expect(prisma.photo.count).toHaveBeenCalledWith({
        where: expect.objectContaining({
          category: 'SHED',
        }),
      })
    })

    it('should include deleted when counting', async () => {
      vi.mocked(prisma.photo.count).mockResolvedValue(20)

      await repository.count({ reptileId: 'clreptile123456', includeDeleted: true })

      expect(prisma.photo.count).toHaveBeenCalledWith({
        where: {
          reptileId: 'clreptile123456',
        },
      })
    })
  })

  describe('findById', () => {
    it('should return photo by id', async () => {
      vi.mocked(prisma.photo.findUnique).mockResolvedValue(mockPhoto)

      const result = await repository.findById('clphoto123456789')

      expect(result).toEqual(mockPhoto)
      expect(prisma.photo.findUnique).toHaveBeenCalledWith({
        where: { id: 'clphoto123456789' },
        include: undefined,
      })
    })

    it('should return null when photo not found', async () => {
      vi.mocked(prisma.photo.findUnique).mockResolvedValue(null)

      const result = await repository.findById('nonexistent')

      expect(result).toBeNull()
    })

    it('should include reptile when requested', async () => {
      const photoWithReptile = {
        ...mockPhoto,
        reptile: { id: 'clreptile123456', userId: 'user-123', deletedAt: null },
      }
      vi.mocked(prisma.photo.findUnique).mockResolvedValue(photoWithReptile)

      await repository.findById('clphoto123456789', { includeReptile: true })

      expect(prisma.photo.findUnique).toHaveBeenCalledWith({
        where: { id: 'clphoto123456789' },
        include: {
          reptile: {
            select: {
              id: true,
              userId: true,
              deletedAt: true,
            },
          },
        },
      })
    })
  })

  describe('create', () => {
    it('should create a new photo with required fields', async () => {
      const createData = {
        reptileId: 'clreptile123456',
        storagePath: 'photos/user-123/reptile-abc/new-photo.jpg',
      }
      vi.mocked(prisma.photo.create).mockResolvedValue({ ...mockPhoto, ...createData })

      const result = await repository.create(createData)

      expect(result.storagePath).toBe('photos/user-123/reptile-abc/new-photo.jpg')
      expect(prisma.photo.create).toHaveBeenCalledWith({
        data: {
          reptileId: 'clreptile123456',
          storagePath: 'photos/user-123/reptile-abc/new-photo.jpg',
          thumbnailPath: null,
          caption: null,
          takenAt: expect.any(Date),
          category: 'GENERAL',
          isPrimary: false,
          shedId: null,
          vetVisitId: null,
          imageData: null,
        },
      })
    })

    it('should create photo with all optional fields', async () => {
      const takenAt = new Date('2024-01-20')
      const createData = {
        reptileId: 'clreptile123456',
        storagePath: 'photos/user-123/reptile-abc/shed-photo.jpg',
        thumbnailPath: 'photos/user-123/reptile-abc/shed-photo_thumb.jpg',
        caption: 'Shed documentation',
        takenAt,
        category: 'SHED' as PhotoCategory,
        isPrimary: false,
        shedId: 'clshed123456789',
      }
      vi.mocked(prisma.photo.create).mockResolvedValue({ ...mockPhoto, ...createData })

      await repository.create(createData)

      expect(prisma.photo.create).toHaveBeenCalledWith({
        data: {
          reptileId: 'clreptile123456',
          storagePath: 'photos/user-123/reptile-abc/shed-photo.jpg',
          thumbnailPath: 'photos/user-123/reptile-abc/shed-photo_thumb.jpg',
          caption: 'Shed documentation',
          takenAt,
          category: 'SHED',
          isPrimary: false,
          shedId: 'clshed123456789',
          vetVisitId: null,
          imageData: null,
        },
      })
    })

    it('should create photo with client-provided id', async () => {
      const createData = {
        id: 'custom-photo-id',
        reptileId: 'clreptile123456',
        storagePath: 'photos/user-123/reptile-abc/photo.jpg',
      }
      vi.mocked(prisma.photo.create).mockResolvedValue({ ...mockPhoto, ...createData })

      await repository.create(createData)

      expect(prisma.photo.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          id: 'custom-photo-id',
        }),
      })
    })

    it('should create primary photo', async () => {
      const createData = {
        reptileId: 'clreptile123456',
        storagePath: 'photos/user-123/reptile-abc/profile.jpg',
        isPrimary: true,
      }
      vi.mocked(prisma.photo.create).mockResolvedValue({ ...mockPhoto, ...createData })

      await repository.create(createData)

      expect(prisma.photo.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          isPrimary: true,
        }),
      })
    })

    it('should create vet visit photo', async () => {
      const createData = {
        reptileId: 'clreptile123456',
        storagePath: 'photos/user-123/reptile-abc/vet-xray.jpg',
        category: 'VETERINARY' as PhotoCategory,
        vetVisitId: 'clvet123456789',
      }
      vi.mocked(prisma.photo.create).mockResolvedValue({ ...mockPhoto, ...createData })

      await repository.create(createData)

      expect(prisma.photo.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          category: 'VETERINARY',
          vetVisitId: 'clvet123456789',
        }),
      })
    })
  })

  describe('update', () => {
    it('should update a photo', async () => {
      const updatedPhoto = { ...mockPhoto, caption: 'Updated caption' }
      vi.mocked(prisma.photo.update).mockResolvedValue(updatedPhoto)

      const result = await repository.update('clphoto123456789', { caption: 'Updated caption' })

      expect(result.caption).toBe('Updated caption')
      expect(prisma.photo.update).toHaveBeenCalledWith({
        where: { id: 'clphoto123456789' },
        data: { caption: 'Updated caption' },
      })
    })

    it('should set photo as primary', async () => {
      vi.mocked(prisma.photo.update).mockResolvedValue({ ...mockPhoto, isPrimary: true })

      await repository.update('clphoto123456789', { isPrimary: true })

      expect(prisma.photo.update).toHaveBeenCalledWith({
        where: { id: 'clphoto123456789' },
        data: { isPrimary: true },
      })
    })

    it('should update category', async () => {
      vi.mocked(prisma.photo.update).mockResolvedValue({ ...mockPhoto, category: 'SHED' as PhotoCategory })

      await repository.update('clphoto123456789', { category: 'SHED' })

      expect(prisma.photo.update).toHaveBeenCalledWith({
        where: { id: 'clphoto123456789' },
        data: { category: 'SHED' },
      })
    })

    it('should clear caption', async () => {
      vi.mocked(prisma.photo.update).mockResolvedValue({ ...mockPhoto, caption: null })

      await repository.update('clphoto123456789', { caption: null })

      expect(prisma.photo.update).toHaveBeenCalledWith({
        where: { id: 'clphoto123456789' },
        data: { caption: null },
      })
    })
  })

  describe('softDelete', () => {
    it('should soft delete a photo by setting deletedAt', async () => {
      const deletedPhoto = { ...mockPhoto, deletedAt: new Date() }
      vi.mocked(prisma.photo.update).mockResolvedValue(deletedPhoto)

      const result = await repository.softDelete('clphoto123456789')

      expect(result.deletedAt).not.toBeNull()
      expect(prisma.photo.update).toHaveBeenCalledWith({
        where: { id: 'clphoto123456789' },
        data: { deletedAt: expect.any(Date) },
      })
    })
  })

  describe('clearPrimaryForReptile', () => {
    it('should clear primary flag for all photos of a reptile', async () => {
      vi.mocked(prisma.photo.updateMany).mockResolvedValue({ count: 1 })

      await repository.clearPrimaryForReptile('clreptile123456')

      expect(prisma.photo.updateMany).toHaveBeenCalledWith({
        where: {
          reptileId: 'clreptile123456',
          isPrimary: true,
          deletedAt: null,
        },
        data: { isPrimary: false },
      })
    })

    it('should only affect non-deleted photos', async () => {
      vi.mocked(prisma.photo.updateMany).mockResolvedValue({ count: 0 })

      await repository.clearPrimaryForReptile('clreptile123456')

      expect(prisma.photo.updateMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          deletedAt: null,
        }),
        data: { isPrimary: false },
      })
    })
  })
})
