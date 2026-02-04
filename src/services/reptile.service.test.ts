// Reptile Service Tests - TDD Red Phase
import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest'
import { ReptileService } from './reptile.service'
import { ReptileRepository } from '@/repositories/reptile.repository'
import type { Sex } from '@/generated/prisma/client'

// Mock the repository
vi.mock('@/repositories/reptile.repository')

// Mock the prisma client
vi.mock('@/lib/db/client', () => ({
  prisma: {
    reptile: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
  },
}))

// Mock the logger
vi.mock('@/lib/logger', () => ({
  createLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  }),
}))

// Mock reptile type for testing
interface MockReptile {
  id: string
  userId: string
  name: string
  species: string
  morph: string | null
  sex: Sex
  birthDate: Date | null
  acquisitionDate: Date
  notes: string | null
  isPublic: boolean
  shareId: string | null
  createdAt: Date
  updatedAt: Date
  deletedAt: Date | null
}

const mockReptile: MockReptile = {
  id: 'cltest123456789',
  userId: 'user-123',
  name: 'Luna',
  species: 'ball_python',
  morph: 'Banana Pied',
  sex: 'FEMALE' as Sex,
  birthDate: new Date('2022-06-15'),
  acquisitionDate: new Date('2022-09-01'),
  notes: 'Great eater',
  isPublic: false,
  shareId: null,
  createdAt: new Date('2022-09-01'),
  updatedAt: new Date('2024-01-15'),
  deletedAt: null,
}

const mockDeletedReptile: MockReptile = {
  ...mockReptile,
  id: 'cldeleted123456',
  deletedAt: new Date('2024-01-20'),
}

describe('ReptileService', () => {
  let service: ReptileService
  let mockRepository: {
    findMany: Mock
    findById: Mock
    create: Mock
    update: Mock
    softDelete: Mock
    restore: Mock
    count: Mock
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockRepository = {
      findMany: vi.fn(),
      findById: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      softDelete: vi.fn(),
      restore: vi.fn(),
      count: vi.fn(),
    }
    vi.mocked(ReptileRepository).mockImplementation(() => mockRepository as unknown as ReptileRepository)
    service = new ReptileService()
  })

  describe('list', () => {
    it('should return paginated reptiles for user', async () => {
      const reptiles = [mockReptile]
      mockRepository.findMany.mockResolvedValue(reptiles)
      mockRepository.count.mockResolvedValue(1)

      const result = await service.list('user-123', { page: 1, limit: 20 })

      expect(result.data).toEqual(reptiles)
      expect(result.meta.page).toBe(1)
      expect(result.meta.limit).toBe(20)
      expect(result.meta.total).toBe(1)
      expect(result.meta.totalPages).toBe(1)
      expect(result.meta.hasNext).toBe(false)
      expect(result.meta.hasPrev).toBe(false)
      expect(mockRepository.findMany).toHaveBeenCalledWith({
        userId: 'user-123',
        skip: 0,
        take: 20,
        orderBy: { createdAt: 'desc' },
        species: undefined,
        sex: undefined,
        search: undefined,
        includeDeleted: false,
        includeProfilePhoto: true,
      })
    })

    it('should apply pagination correctly', async () => {
      mockRepository.findMany.mockResolvedValue([mockReptile])
      mockRepository.count.mockResolvedValue(50)

      const result = await service.list('user-123', { page: 3, limit: 10 })

      expect(result.meta.page).toBe(3)
      expect(result.meta.totalPages).toBe(5)
      expect(result.meta.hasNext).toBe(true)
      expect(result.meta.hasPrev).toBe(true)
      expect(mockRepository.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 20,
          take: 10,
        })
      )
    })

    it('should filter by species', async () => {
      mockRepository.findMany.mockResolvedValue([mockReptile])
      mockRepository.count.mockResolvedValue(1)

      await service.list('user-123', { species: 'ball_python' })

      expect(mockRepository.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          species: 'ball_python',
        })
      )
    })

    it('should filter by sex', async () => {
      mockRepository.findMany.mockResolvedValue([mockReptile])
      mockRepository.count.mockResolvedValue(1)

      await service.list('user-123', { sex: 'FEMALE' })

      expect(mockRepository.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          sex: 'FEMALE',
        })
      )
    })

    it('should support search', async () => {
      mockRepository.findMany.mockResolvedValue([mockReptile])
      mockRepository.count.mockResolvedValue(1)

      await service.list('user-123', { search: 'Luna' })

      expect(mockRepository.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          search: 'Luna',
        })
      )
    })

    it('should support sorting', async () => {
      mockRepository.findMany.mockResolvedValue([mockReptile])
      mockRepository.count.mockResolvedValue(1)

      await service.list('user-123', { sort: 'name', order: 'asc' })

      expect(mockRepository.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { name: 'asc' },
        })
      )
    })

    it('should optionally include deleted reptiles', async () => {
      mockRepository.findMany.mockResolvedValue([mockReptile, mockDeletedReptile])
      mockRepository.count.mockResolvedValue(2)

      await service.list('user-123', { includeDeleted: true })

      expect(mockRepository.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          includeDeleted: true,
        })
      )
    })
  })

  describe('getById', () => {
    it('should return reptile by id for owner', async () => {
      mockRepository.findById.mockResolvedValue(mockReptile)

      const result = await service.getById('user-123', 'cltest123456789')

      expect(result).toEqual(mockReptile)
      expect(mockRepository.findById).toHaveBeenCalledWith('cltest123456789', undefined)
    })

    it('should throw NotFoundError when reptile does not exist', async () => {
      mockRepository.findById.mockResolvedValue(null)

      await expect(service.getById('user-123', 'nonexistent')).rejects.toThrow('Reptile not found')
    })

    it('should throw ForbiddenError when user does not own reptile', async () => {
      mockRepository.findById.mockResolvedValue(mockReptile)

      await expect(service.getById('different-user', 'cltest123456789')).rejects.toThrow('Access denied')
    })

    it('should allow access to public reptile via shareId', async () => {
      const publicReptile = { ...mockReptile, isPublic: true, shareId: 'share123' }
      mockRepository.findById.mockResolvedValue(publicReptile)

      const result = await service.getById('different-user', 'cltest123456789', { shareId: 'share123' })

      expect(result).toEqual(publicReptile)
    })

    it('should not allow access to public reptile with wrong shareId', async () => {
      const publicReptile = { ...mockReptile, isPublic: true, shareId: 'share123' }
      mockRepository.findById.mockResolvedValue(publicReptile)

      await expect(
        service.getById('different-user', 'cltest123456789', { shareId: 'wrongshare' })
      ).rejects.toThrow('Access denied')
    })
  })

  describe('create', () => {
    it('should create a new reptile', async () => {
      const createData = {
        name: 'Apollo',
        species: 'corn_snake',
        acquisitionDate: new Date('2023-10-15'),
      }
      const createdReptile = { ...mockReptile, ...createData, id: 'clnew123456789' }
      mockRepository.create.mockResolvedValue(createdReptile)

      const result = await service.create('user-123', createData)

      expect(result).toEqual(createdReptile)
      // Service always sends null for optional fields not provided
      expect(mockRepository.create).toHaveBeenCalledWith({
        userId: 'user-123',
        name: 'Apollo',
        species: 'corn_snake',
        acquisitionDate: createData.acquisitionDate,
        sex: 'UNKNOWN',
        isPublic: false,
        morph: null,
        birthDate: null,
        notes: null,
      })
    })

    it('should use client-provided id for offline sync', async () => {
      const createData = {
        id: 'clclient123456',
        name: 'Apollo',
        species: 'corn_snake',
        acquisitionDate: new Date('2023-10-15'),
      }
      mockRepository.create.mockResolvedValue({ ...mockReptile, ...createData })

      await service.create('user-123', createData)

      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'clclient123456',
        })
      )
    })

    it('should throw validation error for invalid data', async () => {
      const invalidData = {
        name: '', // empty name
        species: 'corn_snake',
        acquisitionDate: new Date('2023-10-15'),
      }

      await expect(service.create('user-123', invalidData)).rejects.toThrow()
    })

    it('should throw validation error when acquisition date is before birth date', async () => {
      const invalidData = {
        name: 'Apollo',
        species: 'corn_snake',
        birthDate: new Date('2023-10-15'),
        acquisitionDate: new Date('2023-01-01'), // before birth
      }

      try {
        await service.create('user-123', invalidData)
        // Should not reach here
        expect.fail('Expected ValidationError to be thrown')
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
        expect((error as Error).message).toBe('Validation failed')
        // The specific error message should be in fieldErrors
        const validationError = error as { fieldErrors?: Record<string, string[]> }
        expect(validationError.fieldErrors).toBeDefined()
        // Check that field errors contain the acquisition date error
        // The error may be on _root (cross-field validation) or acquisitionDate field
        const allErrors = Object.values(validationError.fieldErrors!).flat()
        expect(allErrors.some(e => e.includes('Acquisition date cannot be before birth date'))).toBe(true)
      }
    })

    it('should include all optional fields when provided', async () => {
      const createData = {
        name: 'Apollo',
        species: 'corn_snake',
        morph: 'Anerythristic',
        sex: 'MALE' as const,
        birthDate: new Date('2023-07-20'),
        acquisitionDate: new Date('2023-10-15'),
        notes: 'Purchased from breeder',
        isPublic: true,
      }
      mockRepository.create.mockResolvedValue({ ...mockReptile, ...createData })

      await service.create('user-123', createData)

      expect(mockRepository.create).toHaveBeenCalledWith({
        userId: 'user-123',
        ...createData,
      })
    })
  })

  describe('update', () => {
    it('should update an existing reptile', async () => {
      mockRepository.findById.mockResolvedValue(mockReptile)
      const updatedReptile = { ...mockReptile, name: 'Luna Updated' }
      mockRepository.update.mockResolvedValue(updatedReptile)

      const result = await service.update('user-123', 'cltest123456789', { name: 'Luna Updated' })

      expect(result).toEqual(updatedReptile)
      expect(mockRepository.update).toHaveBeenCalledWith('cltest123456789', { name: 'Luna Updated' })
    })

    it('should throw NotFoundError when reptile does not exist', async () => {
      mockRepository.findById.mockResolvedValue(null)

      await expect(
        service.update('user-123', 'nonexistent', { name: 'Updated' })
      ).rejects.toThrow('Reptile not found')
    })

    it('should throw ForbiddenError when user does not own reptile', async () => {
      mockRepository.findById.mockResolvedValue(mockReptile)

      await expect(
        service.update('different-user', 'cltest123456789', { name: 'Updated' })
      ).rejects.toThrow('Access denied')
    })

    it('should throw NotFoundError for deleted reptile', async () => {
      mockRepository.findById.mockResolvedValue(mockDeletedReptile)

      await expect(
        service.update('user-123', 'cldeleted123456', { name: 'Updated' })
      ).rejects.toThrow('Reptile not found')
    })

    it('should allow partial updates', async () => {
      mockRepository.findById.mockResolvedValue(mockReptile)
      mockRepository.update.mockResolvedValue({ ...mockReptile, morph: 'Albino' })

      await service.update('user-123', 'cltest123456789', { morph: 'Albino' })

      expect(mockRepository.update).toHaveBeenCalledWith('cltest123456789', { morph: 'Albino' })
    })

    it('should allow setting nullable fields to null', async () => {
      mockRepository.findById.mockResolvedValue(mockReptile)
      mockRepository.update.mockResolvedValue({ ...mockReptile, notes: null })

      await service.update('user-123', 'cltest123456789', { notes: null })

      expect(mockRepository.update).toHaveBeenCalledWith('cltest123456789', { notes: null })
    })
  })

  describe('softDelete', () => {
    it('should soft delete a reptile', async () => {
      mockRepository.findById.mockResolvedValue(mockReptile)
      const deletedAt = new Date()
      mockRepository.softDelete.mockResolvedValue({ ...mockReptile, deletedAt })

      const result = await service.softDelete('user-123', 'cltest123456789')

      expect(result.id).toBe('cltest123456789')
      expect(result.deletedAt).toEqual(deletedAt)
      expect(mockRepository.softDelete).toHaveBeenCalledWith('cltest123456789')
    })

    it('should throw NotFoundError when reptile does not exist', async () => {
      mockRepository.findById.mockResolvedValue(null)

      await expect(service.softDelete('user-123', 'nonexistent')).rejects.toThrow('Reptile not found')
    })

    it('should throw ForbiddenError when user does not own reptile', async () => {
      mockRepository.findById.mockResolvedValue(mockReptile)

      await expect(service.softDelete('different-user', 'cltest123456789')).rejects.toThrow('Access denied')
    })

    it('should throw NotFoundError for already deleted reptile', async () => {
      mockRepository.findById.mockResolvedValue(mockDeletedReptile)

      await expect(service.softDelete('user-123', 'cldeleted123456')).rejects.toThrow('Reptile not found')
    })
  })

  describe('restore', () => {
    it('should restore a soft-deleted reptile', async () => {
      mockRepository.findById.mockResolvedValue(mockDeletedReptile)
      const restoredReptile = { ...mockDeletedReptile, deletedAt: null }
      mockRepository.restore.mockResolvedValue(restoredReptile)

      const result = await service.restore('user-123', 'cldeleted123456')

      expect(result.deletedAt).toBeNull()
      expect(mockRepository.restore).toHaveBeenCalledWith('cldeleted123456')
    })

    it('should throw NotFoundError when reptile does not exist', async () => {
      mockRepository.findById.mockResolvedValue(null)

      await expect(service.restore('user-123', 'nonexistent')).rejects.toThrow('Reptile not found')
    })

    it('should throw ForbiddenError when user does not own reptile', async () => {
      mockRepository.findById.mockResolvedValue(mockDeletedReptile)

      await expect(service.restore('different-user', 'cldeleted123456')).rejects.toThrow('Access denied')
    })

    it('should throw error when reptile is not deleted', async () => {
      mockRepository.findById.mockResolvedValue(mockReptile) // not deleted

      await expect(service.restore('user-123', 'cltest123456789')).rejects.toThrow('Reptile is not deleted')
    })
  })
})
