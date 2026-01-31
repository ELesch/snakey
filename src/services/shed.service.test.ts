// Shed Service Tests - TDD
import { describe, it, expect, beforeEach, vi, Mock } from 'vitest'
import { prisma } from '@/lib/db/client'
import type { Shed, Reptile, ShedQuality } from '@/generated/prisma/client'

// Mock logger
vi.mock('@/lib/logger', () => ({
  createLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  }),
}))

// Import after mocks are set up
import {
  ShedService,
  NotFoundError,
  ForbiddenError,
  ValidationError,
} from './shed.service'

describe('ShedService', () => {
  let service: ShedService

  const userId = 'user-123'
  const reptileId = 'reptile-456'
  const shedId = 'shed-789'

  const mockReptile = {
    id: reptileId,
    userId,
    name: 'Test Snake',
    species: 'Ball Python',
    deletedAt: null,
    morph: null,
    sex: 'UNKNOWN',
    birthDate: null,
    acquisitionDate: new Date(),
    currentWeight: null,
    notes: null,
    isPublic: false,
    shareId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as Reptile

  const mockShed = {
    id: shedId,
    reptileId,
    startDate: null,
    completedDate: new Date('2024-01-15'),
    quality: 'COMPLETE' as ShedQuality,
    isComplete: true,
    issues: null,
    notes: 'Clean shed',
    createdAt: new Date(),
    updatedAt: new Date(),
  } as Shed

  beforeEach(() => {
    vi.clearAllMocks()
    service = new ShedService()
  })

  describe('list', () => {
    it('should list sheds for a reptile owned by the user', async () => {
      const mockSheds = [mockShed, { ...mockShed, id: 'shed-2' }]
      ;(prisma.reptile.findUnique as Mock).mockResolvedValue(mockReptile)
      ;(prisma.shed.findMany as Mock).mockResolvedValue(mockSheds)
      ;(prisma.shed.count as Mock).mockResolvedValue(2)

      const result = await service.list(userId, reptileId)

      expect(result.data).toHaveLength(2)
      expect(result.meta.total).toBe(2)
      expect(prisma.reptile.findUnique).toHaveBeenCalled()
    })

    it('should throw NotFoundError if reptile does not exist', async () => {
      ;(prisma.reptile.findUnique as Mock).mockResolvedValue(null)

      await expect(service.list(userId, reptileId)).rejects.toThrow(NotFoundError)
    })

    it('should throw ForbiddenError if user does not own the reptile', async () => {
      ;(prisma.reptile.findUnique as Mock).mockResolvedValue({
        ...mockReptile,
        userId: 'other-user',
      })

      await expect(service.list(userId, reptileId)).rejects.toThrow(ForbiddenError)
    })

    it('should support pagination', async () => {
      ;(prisma.reptile.findUnique as Mock).mockResolvedValue(mockReptile)
      ;(prisma.shed.findMany as Mock).mockResolvedValue([mockShed])
      ;(prisma.shed.count as Mock).mockResolvedValue(25)

      const result = await service.list(userId, reptileId, { page: 2, limit: 10 })

      expect(result.meta.page).toBe(2)
      expect(result.meta.limit).toBe(10)
      expect(result.meta.totalPages).toBe(3)
      expect(result.meta.hasNext).toBe(true)
      expect(result.meta.hasPrev).toBe(true)
    })

    it('should throw NotFoundError if reptile is deleted', async () => {
      ;(prisma.reptile.findUnique as Mock).mockResolvedValue({
        ...mockReptile,
        deletedAt: new Date(),
      })

      await expect(service.list(userId, reptileId)).rejects.toThrow(NotFoundError)
    })
  })

  describe('getById', () => {
    it('should return a shed by ID', async () => {
      ;(prisma.shed.findUnique as Mock).mockResolvedValue(mockShed)
      ;(prisma.reptile.findUnique as Mock).mockResolvedValue(mockReptile)

      const result = await service.getById(userId, shedId)

      expect(result).toEqual(mockShed)
    })

    it('should throw NotFoundError if shed does not exist', async () => {
      ;(prisma.shed.findUnique as Mock).mockResolvedValue(null)

      await expect(service.getById(userId, shedId)).rejects.toThrow(NotFoundError)
    })

    it('should throw ForbiddenError if user does not own the reptile', async () => {
      ;(prisma.shed.findUnique as Mock).mockResolvedValue(mockShed)
      ;(prisma.reptile.findUnique as Mock).mockResolvedValue({
        ...mockReptile,
        userId: 'other-user',
      })

      await expect(service.getById(userId, shedId)).rejects.toThrow(ForbiddenError)
    })
  })

  describe('create', () => {
    const validCreateData = {
      completedDate: new Date('2024-01-15'),
      quality: 'COMPLETE' as ShedQuality,
      isComplete: true,
      notes: 'Clean shed',
    }

    it('should create a shed for a reptile owned by the user', async () => {
      ;(prisma.reptile.findUnique as Mock).mockResolvedValue(mockReptile)
      ;(prisma.shed.create as Mock).mockResolvedValue(mockShed)

      const result = await service.create(userId, reptileId, validCreateData)

      expect(result).toEqual(mockShed)
      expect(prisma.shed.create).toHaveBeenCalled()
    })

    it('should throw NotFoundError if reptile does not exist', async () => {
      ;(prisma.reptile.findUnique as Mock).mockResolvedValue(null)

      await expect(
        service.create(userId, reptileId, validCreateData)
      ).rejects.toThrow(NotFoundError)
    })

    it('should throw ForbiddenError if user does not own the reptile', async () => {
      ;(prisma.reptile.findUnique as Mock).mockResolvedValue({
        ...mockReptile,
        userId: 'other-user',
      })

      await expect(
        service.create(userId, reptileId, validCreateData)
      ).rejects.toThrow(ForbiddenError)
    })

    it('should throw ValidationError for invalid quality value', async () => {
      ;(prisma.reptile.findUnique as Mock).mockResolvedValue(mockReptile)

      await expect(
        service.create(userId, reptileId, {
          completedDate: new Date(),
          quality: 'INVALID',
        })
      ).rejects.toThrow(ValidationError)
    })

    it('should throw ValidationError if completedDate is missing', async () => {
      ;(prisma.reptile.findUnique as Mock).mockResolvedValue(mockReptile)

      await expect(
        service.create(userId, reptileId, { quality: 'COMPLETE' })
      ).rejects.toThrow(ValidationError)
    })

    it('should throw NotFoundError if reptile is deleted', async () => {
      ;(prisma.reptile.findUnique as Mock).mockResolvedValue({
        ...mockReptile,
        deletedAt: new Date(),
      })

      await expect(
        service.create(userId, reptileId, validCreateData)
      ).rejects.toThrow(NotFoundError)
    })

    it('should allow optional startDate', async () => {
      const dataWithStartDate = {
        ...validCreateData,
        startDate: new Date('2024-01-10'),
      }
      ;(prisma.reptile.findUnique as Mock).mockResolvedValue(mockReptile)
      ;(prisma.shed.create as Mock).mockResolvedValue({
        ...mockShed,
        startDate: new Date('2024-01-10'),
      })

      const result = await service.create(userId, reptileId, dataWithStartDate)

      expect(result.startDate).toEqual(new Date('2024-01-10'))
    })

    it('should validate completedDate is not before startDate', async () => {
      ;(prisma.reptile.findUnique as Mock).mockResolvedValue(mockReptile)

      await expect(
        service.create(userId, reptileId, {
          startDate: new Date('2024-01-20'),
          completedDate: new Date('2024-01-15'),
          quality: 'COMPLETE',
        })
      ).rejects.toThrow(ValidationError)
    })
  })

  describe('update', () => {
    const validUpdateData = {
      quality: 'PARTIAL' as ShedQuality,
      notes: 'Updated notes',
    }

    it('should update an existing shed', async () => {
      const updatedShed = { ...mockShed, ...validUpdateData }
      ;(prisma.shed.findUnique as Mock).mockResolvedValue(mockShed)
      ;(prisma.reptile.findUnique as Mock).mockResolvedValue(mockReptile)
      ;(prisma.shed.update as Mock).mockResolvedValue(updatedShed)

      const result = await service.update(userId, shedId, validUpdateData)

      expect(result.quality).toBe('PARTIAL')
      expect(result.notes).toBe('Updated notes')
    })

    it('should throw NotFoundError if shed does not exist', async () => {
      ;(prisma.shed.findUnique as Mock).mockResolvedValue(null)

      await expect(
        service.update(userId, shedId, validUpdateData)
      ).rejects.toThrow(NotFoundError)
    })

    it('should throw ForbiddenError if user does not own the reptile', async () => {
      ;(prisma.shed.findUnique as Mock).mockResolvedValue(mockShed)
      ;(prisma.reptile.findUnique as Mock).mockResolvedValue({
        ...mockReptile,
        userId: 'other-user',
      })

      await expect(
        service.update(userId, shedId, validUpdateData)
      ).rejects.toThrow(ForbiddenError)
    })

    it('should throw ValidationError for invalid quality value', async () => {
      ;(prisma.shed.findUnique as Mock).mockResolvedValue(mockShed)
      ;(prisma.reptile.findUnique as Mock).mockResolvedValue(mockReptile)

      await expect(
        service.update(userId, shedId, { quality: 'INVALID' })
      ).rejects.toThrow(ValidationError)
    })

    it('should allow partial updates', async () => {
      const partialUpdate = { notes: 'Only updating notes' }
      const updatedShed = { ...mockShed, notes: 'Only updating notes' }
      ;(prisma.shed.findUnique as Mock).mockResolvedValue(mockShed)
      ;(prisma.reptile.findUnique as Mock).mockResolvedValue(mockReptile)
      ;(prisma.shed.update as Mock).mockResolvedValue(updatedShed)

      const result = await service.update(userId, shedId, partialUpdate)

      expect(result.notes).toBe('Only updating notes')
      expect(result.quality).toBe('COMPLETE') // Unchanged
    })
  })

  describe('delete', () => {
    it('should delete a shed', async () => {
      ;(prisma.shed.findUnique as Mock).mockResolvedValue(mockShed)
      ;(prisma.reptile.findUnique as Mock).mockResolvedValue(mockReptile)
      ;(prisma.shed.delete as Mock).mockResolvedValue(mockShed)

      const result = await service.delete(userId, shedId)

      expect(result.id).toBe(shedId)
      expect(result.deletedAt).toBeDefined()
    })

    it('should throw NotFoundError if shed does not exist', async () => {
      ;(prisma.shed.findUnique as Mock).mockResolvedValue(null)

      await expect(service.delete(userId, shedId)).rejects.toThrow(NotFoundError)
    })

    it('should throw ForbiddenError if user does not own the reptile', async () => {
      ;(prisma.shed.findUnique as Mock).mockResolvedValue(mockShed)
      ;(prisma.reptile.findUnique as Mock).mockResolvedValue({
        ...mockReptile,
        userId: 'other-user',
      })

      await expect(service.delete(userId, shedId)).rejects.toThrow(ForbiddenError)
    })
  })
})
