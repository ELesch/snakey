// Feeding Service Tests - TDD Red Phase
import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  FeedingService,
  NotFoundError,
  ForbiddenError,
  ValidationError,
} from './feeding.service'

// Mock the repository
vi.mock('@/repositories/feeding.repository', () => ({
  FeedingRepository: vi.fn().mockImplementation(() => ({
    findMany: vi.fn(),
    count: vi.fn(),
    findById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  })),
}))

// Mock the reptile repository for ownership checks
vi.mock('@/repositories/reptile.repository', () => ({
  ReptileRepository: vi.fn().mockImplementation(() => ({
    findById: vi.fn(),
  })),
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

describe('FeedingService', () => {
  let service: FeedingService
  let mockFeedingRepo: {
    findMany: ReturnType<typeof vi.fn>
    count: ReturnType<typeof vi.fn>
    findById: ReturnType<typeof vi.fn>
    create: ReturnType<typeof vi.fn>
    update: ReturnType<typeof vi.fn>
    delete: ReturnType<typeof vi.fn>
  }
  let mockReptileRepo: {
    findById: ReturnType<typeof vi.fn>
  }

  const userId = 'user-123'
  const reptileId = 'reptile-456'
  const feedingId = 'feeding-789'

  const mockReptile = {
    id: reptileId,
    userId,
    name: 'Monty',
    species: 'Ball Python',
    deletedAt: null,
  }

  const mockFeeding = {
    id: feedingId,
    reptileId,
    date: new Date('2025-01-15'),
    preyType: 'Mouse',
    preySize: 'Medium',
    preySource: 'FROZEN_THAWED',
    accepted: true,
    refused: false,
    regurgitated: false,
    notes: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  beforeEach(async () => {
    vi.clearAllMocks()

    // Get mock instances
    const { FeedingRepository } = await import('@/repositories/feeding.repository')
    const { ReptileRepository } = await import('@/repositories/reptile.repository')

    service = new FeedingService()

    // Access the mocked repositories
    mockFeedingRepo = (service as unknown as { feedingRepository: typeof mockFeedingRepo }).feedingRepository
    mockReptileRepo = (service as unknown as { reptileRepository: typeof mockReptileRepo }).reptileRepository
  })

  describe('list', () => {
    it('should list feedings for a reptile owned by the user', async () => {
      mockReptileRepo.findById.mockResolvedValue(mockReptile)
      mockFeedingRepo.findMany.mockResolvedValue([mockFeeding])
      mockFeedingRepo.count.mockResolvedValue(1)

      const result = await service.list(userId, reptileId, {})

      expect(result.data).toHaveLength(1)
      expect(result.data[0].id).toBe(feedingId)
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
      mockFeedingRepo.findMany.mockResolvedValue([mockFeeding])
      mockFeedingRepo.count.mockResolvedValue(25)

      const result = await service.list(userId, reptileId, { page: 2, limit: 10 })

      expect(result.meta.page).toBe(2)
      expect(result.meta.limit).toBe(10)
      expect(result.meta.totalPages).toBe(3)
      expect(result.meta.hasNext).toBe(true)
      expect(result.meta.hasPrev).toBe(true)
    })

    it('should support date filtering', async () => {
      mockReptileRepo.findById.mockResolvedValue(mockReptile)
      mockFeedingRepo.findMany.mockResolvedValue([mockFeeding])
      mockFeedingRepo.count.mockResolvedValue(1)

      const startDate = new Date('2025-01-01')
      const endDate = new Date('2025-01-31')

      await service.list(userId, reptileId, { startDate, endDate })

      expect(mockFeedingRepo.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          startDate,
          endDate,
        })
      )
    })
  })

  describe('getById', () => {
    it('should return a feeding if user owns the reptile', async () => {
      mockFeedingRepo.findById.mockResolvedValue({ ...mockFeeding, reptile: mockReptile })

      const result = await service.getById(userId, feedingId)

      expect(result.id).toBe(feedingId)
    })

    it('should throw NotFoundError if feeding does not exist', async () => {
      mockFeedingRepo.findById.mockResolvedValue(null)

      await expect(service.getById(userId, feedingId)).rejects.toThrow(NotFoundError)
    })

    it('should throw ForbiddenError if user does not own the reptile', async () => {
      mockFeedingRepo.findById.mockResolvedValue({
        ...mockFeeding,
        reptile: { ...mockReptile, userId: 'other-user' },
      })

      await expect(service.getById(userId, feedingId)).rejects.toThrow(ForbiddenError)
    })
  })

  describe('create', () => {
    const validInput = {
      date: '2025-01-15',
      preyType: 'Mouse',
      preySize: 'Medium',
      preySource: 'FROZEN_THAWED',
      accepted: true,
    }

    it('should create a feeding for a reptile owned by the user', async () => {
      mockReptileRepo.findById.mockResolvedValue(mockReptile)
      mockFeedingRepo.create.mockResolvedValue(mockFeeding)

      const result = await service.create(userId, reptileId, validInput)

      expect(result.id).toBe(feedingId)
      expect(mockFeedingRepo.create).toHaveBeenCalled()
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

      const invalidInput = { preyType: '' } // Missing required fields

      await expect(service.create(userId, reptileId, invalidInput)).rejects.toThrow(ValidationError)
    })

    it('should throw ValidationError for invalid prey source', async () => {
      mockReptileRepo.findById.mockResolvedValue(mockReptile)

      const invalidInput = { ...validInput, preySource: 'INVALID' }

      await expect(service.create(userId, reptileId, invalidInput)).rejects.toThrow(ValidationError)
    })

    it('should throw NotFoundError if reptile is deleted', async () => {
      mockReptileRepo.findById.mockResolvedValue({ ...mockReptile, deletedAt: new Date() })

      await expect(service.create(userId, reptileId, validInput)).rejects.toThrow(NotFoundError)
    })
  })

  describe('update', () => {
    const updateInput = {
      preySize: 'Large',
      notes: 'Ate quickly',
    }

    it('should update a feeding if user owns the reptile', async () => {
      mockFeedingRepo.findById.mockResolvedValue({ ...mockFeeding, reptile: mockReptile })
      mockFeedingRepo.update.mockResolvedValue({ ...mockFeeding, ...updateInput })

      const result = await service.update(userId, feedingId, updateInput)

      expect(result.preySize).toBe('Large')
      expect(result.notes).toBe('Ate quickly')
    })

    it('should throw NotFoundError if feeding does not exist', async () => {
      mockFeedingRepo.findById.mockResolvedValue(null)

      await expect(service.update(userId, feedingId, updateInput)).rejects.toThrow(NotFoundError)
    })

    it('should throw ForbiddenError if user does not own the reptile', async () => {
      mockFeedingRepo.findById.mockResolvedValue({
        ...mockFeeding,
        reptile: { ...mockReptile, userId: 'other-user' },
      })

      await expect(service.update(userId, feedingId, updateInput)).rejects.toThrow(ForbiddenError)
    })

    it('should throw ValidationError for invalid input', async () => {
      mockFeedingRepo.findById.mockResolvedValue({ ...mockFeeding, reptile: mockReptile })

      const invalidInput = { preyType: '' } // Empty string not allowed

      await expect(service.update(userId, feedingId, invalidInput)).rejects.toThrow(ValidationError)
    })
  })

  describe('delete', () => {
    it('should delete a feeding if user owns the reptile', async () => {
      mockFeedingRepo.findById.mockResolvedValue({ ...mockFeeding, reptile: mockReptile })
      mockFeedingRepo.delete.mockResolvedValue(mockFeeding)

      const result = await service.delete(userId, feedingId)

      expect(result.id).toBe(feedingId)
      expect(mockFeedingRepo.delete).toHaveBeenCalledWith(feedingId)
    })

    it('should throw NotFoundError if feeding does not exist', async () => {
      mockFeedingRepo.findById.mockResolvedValue(null)

      await expect(service.delete(userId, feedingId)).rejects.toThrow(NotFoundError)
    })

    it('should throw ForbiddenError if user does not own the reptile', async () => {
      mockFeedingRepo.findById.mockResolvedValue({
        ...mockFeeding,
        reptile: { ...mockReptile, userId: 'other-user' },
      })

      await expect(service.delete(userId, feedingId)).rejects.toThrow(ForbiddenError)
    })
  })
})
