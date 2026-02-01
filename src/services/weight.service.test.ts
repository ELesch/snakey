// Weight Service Tests - TDD Red Phase
import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  WeightService,
  NotFoundError,
  ForbiddenError,
  ValidationError,
} from './weight.service'

// Mock the repository
vi.mock('@/repositories/weight.repository', () => ({
  WeightRepository: vi.fn().mockImplementation(() => ({
    findMany: vi.fn(),
    count: vi.fn(),
    findById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
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

// Mock logger
vi.mock('@/lib/logger', () => ({
  createLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  }),
}))

describe('WeightService', () => {
  let service: WeightService
  let mockWeightRepo: {
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
  const weightId = 'weight-789'

  const mockReptile = {
    id: reptileId,
    userId,
    name: 'Slither',
    species: 'ball_python',
    deletedAt: null,
  }

  const mockWeight = {
    id: weightId,
    reptileId,
    date: new Date('2024-06-15'),
    weight: 350.5,
    notes: 'Post-shed weight',
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  beforeEach(async () => {
    vi.clearAllMocks()

    // Get the mock instance from the module
    const { reptileRepository } = await import('@/repositories/reptile.repository')

    service = new WeightService()

    // Get the mock instance from the service
    mockWeightRepo = (service as unknown as { weightRepository: typeof mockWeightRepo }).weightRepository
    // Use the global mock for ReptileRepository (used by base.service)
    mockReptileRepo = reptileRepository as unknown as typeof mockReptileRepo
  })

  describe('list', () => {
    it('should return weights for a reptile owned by user', async () => {
      mockReptileRepo.findById.mockResolvedValue(mockReptile)
      mockWeightRepo.findMany.mockResolvedValue([mockWeight])
      mockWeightRepo.count.mockResolvedValue(1)

      const result = await service.list(userId, reptileId, {})

      expect(result.data).toHaveLength(1)
      expect(result.data[0].id).toBe(weightId)
      expect(result.meta.total).toBe(1)
    })

    it('should throw NotFoundError if reptile does not exist', async () => {
      mockReptileRepo.findById.mockResolvedValue(null)

      await expect(service.list(userId, reptileId, {})).rejects.toThrow(NotFoundError)
    })

    it('should throw ForbiddenError if user does not own reptile', async () => {
      mockReptileRepo.findById.mockResolvedValue({ ...mockReptile, userId: 'other-user' })

      await expect(service.list(userId, reptileId, {})).rejects.toThrow(ForbiddenError)
    })

    it('should support date range filtering', async () => {
      mockReptileRepo.findById.mockResolvedValue(mockReptile)
      mockWeightRepo.findMany.mockResolvedValue([mockWeight])
      mockWeightRepo.count.mockResolvedValue(1)

      const startDate = new Date('2024-01-01')
      const endDate = new Date('2024-12-31')

      await service.list(userId, reptileId, { startDate, endDate })

      expect(mockWeightRepo.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          reptileId,
          startDate,
          endDate,
        })
      )
    })

    it('should paginate results', async () => {
      mockReptileRepo.findById.mockResolvedValue(mockReptile)
      mockWeightRepo.findMany.mockResolvedValue([mockWeight])
      mockWeightRepo.count.mockResolvedValue(25)

      const result = await service.list(userId, reptileId, { page: 2, limit: 10 })

      expect(result.meta.page).toBe(2)
      expect(result.meta.limit).toBe(10)
      expect(result.meta.totalPages).toBe(3)
      expect(result.meta.hasNext).toBe(true)
      expect(result.meta.hasPrev).toBe(true)
    })
  })

  describe('getById', () => {
    it('should return a weight by id', async () => {
      // verifyRecordOwnership calls findById with includeReptile: true
      mockWeightRepo.findById.mockResolvedValue({ ...mockWeight, reptile: mockReptile })

      const result = await service.getById(userId, weightId)

      expect(result.id).toBe(weightId)
      expect(result.weight).toBe(350.5)
    })

    it('should throw NotFoundError if weight does not exist', async () => {
      mockWeightRepo.findById.mockResolvedValue(null)

      await expect(service.getById(userId, weightId)).rejects.toThrow(NotFoundError)
    })

    it('should throw ForbiddenError if user does not own reptile', async () => {
      // verifyRecordOwnership checks ownership via the reptile relation
      mockWeightRepo.findById.mockResolvedValue({
        ...mockWeight,
        reptile: { ...mockReptile, userId: 'other-user' },
      })

      await expect(service.getById(userId, weightId)).rejects.toThrow(ForbiddenError)
    })
  })

  describe('create', () => {
    const validData = {
      date: new Date('2024-06-15'),
      weight: 350.5,
      notes: 'Post-shed weight',
    }

    it('should create a weight for owned reptile', async () => {
      mockReptileRepo.findById.mockResolvedValue(mockReptile)
      mockWeightRepo.create.mockResolvedValue(mockWeight)

      const result = await service.create(userId, reptileId, validData)

      expect(result.id).toBe(weightId)
      expect(mockWeightRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          reptileId,
          weight: 350.5,
        })
      )
    })

    it('should throw NotFoundError if reptile does not exist', async () => {
      mockReptileRepo.findById.mockResolvedValue(null)

      await expect(service.create(userId, reptileId, validData)).rejects.toThrow(NotFoundError)
    })

    it('should throw ForbiddenError if user does not own reptile', async () => {
      mockReptileRepo.findById.mockResolvedValue({ ...mockReptile, userId: 'other-user' })

      await expect(service.create(userId, reptileId, validData)).rejects.toThrow(ForbiddenError)
    })

    it('should throw ValidationError if weight is negative', async () => {
      mockReptileRepo.findById.mockResolvedValue(mockReptile)

      await expect(
        service.create(userId, reptileId, { ...validData, weight: -10 })
      ).rejects.toThrow(ValidationError)
    })

    it('should throw ValidationError if weight is zero', async () => {
      mockReptileRepo.findById.mockResolvedValue(mockReptile)

      await expect(
        service.create(userId, reptileId, { ...validData, weight: 0 })
      ).rejects.toThrow(ValidationError)
    })

    it('should throw ValidationError if date is missing', async () => {
      mockReptileRepo.findById.mockResolvedValue(mockReptile)

      await expect(
        service.create(userId, reptileId, { weight: 350.5 })
      ).rejects.toThrow(ValidationError)
    })
  })

  describe('update', () => {
    const updateData = {
      weight: 375.0,
      notes: 'Updated weight',
    }

    it('should update a weight owned by user', async () => {
      // verifyRecordOwnership calls findById with includeReptile: true
      mockWeightRepo.findById.mockResolvedValue({ ...mockWeight, reptile: mockReptile })
      mockWeightRepo.update.mockResolvedValue({ ...mockWeight, ...updateData })

      const result = await service.update(userId, weightId, updateData)

      expect(result.weight).toBe(375.0)
      expect(mockWeightRepo.update).toHaveBeenCalledWith(weightId, expect.objectContaining(updateData))
    })

    it('should throw NotFoundError if weight does not exist', async () => {
      mockWeightRepo.findById.mockResolvedValue(null)

      await expect(service.update(userId, weightId, updateData)).rejects.toThrow(NotFoundError)
    })

    it('should throw ForbiddenError if user does not own reptile', async () => {
      // verifyRecordOwnership checks ownership via the reptile relation
      mockWeightRepo.findById.mockResolvedValue({
        ...mockWeight,
        reptile: { ...mockReptile, userId: 'other-user' },
      })

      await expect(service.update(userId, weightId, updateData)).rejects.toThrow(ForbiddenError)
    })

    it('should throw ValidationError if updating to negative weight', async () => {
      mockWeightRepo.findById.mockResolvedValue({ ...mockWeight, reptile: mockReptile })

      await expect(
        service.update(userId, weightId, { weight: -5 })
      ).rejects.toThrow(ValidationError)
    })
  })

  describe('delete', () => {
    it('should delete a weight owned by user', async () => {
      // verifyRecordOwnership calls findById with includeReptile: true
      mockWeightRepo.findById.mockResolvedValue({ ...mockWeight, reptile: mockReptile })
      mockWeightRepo.delete.mockResolvedValue(mockWeight)

      const result = await service.delete(userId, weightId)

      expect(result.id).toBe(weightId)
      expect(mockWeightRepo.delete).toHaveBeenCalledWith(weightId)
    })

    it('should throw NotFoundError if weight does not exist', async () => {
      mockWeightRepo.findById.mockResolvedValue(null)

      await expect(service.delete(userId, weightId)).rejects.toThrow(NotFoundError)
    })

    it('should throw ForbiddenError if user does not own reptile', async () => {
      // verifyRecordOwnership checks ownership via the reptile relation
      mockWeightRepo.findById.mockResolvedValue({
        ...mockWeight,
        reptile: { ...mockReptile, userId: 'other-user' },
      })

      await expect(service.delete(userId, weightId)).rejects.toThrow(ForbiddenError)
    })
  })
})
