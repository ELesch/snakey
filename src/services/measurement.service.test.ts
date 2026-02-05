// Measurement Service Tests
import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  MeasurementService,
  NotFoundError,
  ForbiddenError,
  ValidationError,
} from './measurement.service'
import type { MeasurementType } from '@/generated/prisma/client'

// Mock the repository
vi.mock('@/repositories/measurement.repository', () => ({
  MeasurementRepository: vi.fn().mockImplementation(() => ({
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

describe('MeasurementService', () => {
  let service: MeasurementService
  let mockMeasurementRepo: {
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
  const measurementId = 'measurement-789'

  const mockReptile = {
    id: reptileId,
    userId,
    name: 'Monty',
    species: 'Ball Python',
    deletedAt: null,
  }

  const mockMeasurement = {
    id: measurementId,
    reptileId,
    date: new Date('2025-01-15'),
    type: 'WEIGHT' as MeasurementType,
    value: 450.5,
    unit: 'g',
    notes: 'Post-feeding weight',
    createdAt: new Date(),
  }

  const mockLengthMeasurement = {
    ...mockMeasurement,
    id: 'measurement-790',
    type: 'LENGTH' as MeasurementType,
    value: 120,
    unit: 'cm',
    notes: null,
  }

  beforeEach(async () => {
    vi.clearAllMocks()

    // Get the mock instance from the module (used by base.service)
    const { reptileRepository } = await import('@/repositories/reptile.repository')

    service = new MeasurementService()

    // Access the mocked repositories
    mockMeasurementRepo = (
      service as unknown as { measurementRepository: typeof mockMeasurementRepo }
    ).measurementRepository
    mockReptileRepo = reptileRepository as unknown as typeof mockReptileRepo
  })

  describe('list', () => {
    it('should list measurements for a reptile owned by the user', async () => {
      mockReptileRepo.findById.mockResolvedValue(mockReptile)
      mockMeasurementRepo.findMany.mockResolvedValue([mockMeasurement])
      mockMeasurementRepo.count.mockResolvedValue(1)

      const result = await service.list(userId, reptileId, {})

      expect(result.data).toHaveLength(1)
      expect(result.data[0].id).toBe(measurementId)
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
      mockMeasurementRepo.findMany.mockResolvedValue([mockMeasurement])
      mockMeasurementRepo.count.mockResolvedValue(25)

      const result = await service.list(userId, reptileId, { page: 2, limit: 10 })

      expect(result.meta.page).toBe(2)
      expect(result.meta.limit).toBe(10)
      expect(result.meta.totalPages).toBe(3)
      expect(result.meta.hasNext).toBe(true)
      expect(result.meta.hasPrev).toBe(true)
    })

    it('should support filtering by measurement type', async () => {
      mockReptileRepo.findById.mockResolvedValue(mockReptile)
      mockMeasurementRepo.findMany.mockResolvedValue([mockMeasurement])
      mockMeasurementRepo.count.mockResolvedValue(1)

      await service.list(userId, reptileId, { type: 'WEIGHT' })

      expect(mockMeasurementRepo.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'WEIGHT',
        })
      )
    })

    it('should support date filtering', async () => {
      mockReptileRepo.findById.mockResolvedValue(mockReptile)
      mockMeasurementRepo.findMany.mockResolvedValue([mockMeasurement])
      mockMeasurementRepo.count.mockResolvedValue(1)

      const startDate = new Date('2025-01-01')
      const endDate = new Date('2025-01-31')

      await service.list(userId, reptileId, { startDate, endDate })

      expect(mockMeasurementRepo.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          startDate,
          endDate,
        })
      )
    })

    it('should support custom sorting', async () => {
      mockReptileRepo.findById.mockResolvedValue(mockReptile)
      mockMeasurementRepo.findMany.mockResolvedValue([mockMeasurement])
      mockMeasurementRepo.count.mockResolvedValue(1)

      await service.list(userId, reptileId, { sort: 'value', order: 'asc' })

      expect(mockMeasurementRepo.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { value: 'asc' },
        })
      )
    })

    it('should throw NotFoundError if reptile is deleted', async () => {
      mockReptileRepo.findById.mockResolvedValue({ ...mockReptile, deletedAt: new Date() })

      await expect(service.list(userId, reptileId, {})).rejects.toThrow(NotFoundError)
    })
  })

  describe('getById', () => {
    it('should return a measurement if user owns the reptile', async () => {
      mockMeasurementRepo.findById.mockResolvedValue({ ...mockMeasurement, reptile: mockReptile })

      const result = await service.getById(userId, measurementId)

      expect(result.id).toBe(measurementId)
    })

    it('should throw NotFoundError if measurement does not exist', async () => {
      mockMeasurementRepo.findById.mockResolvedValue(null)

      await expect(service.getById(userId, measurementId)).rejects.toThrow(NotFoundError)
    })

    it('should throw ForbiddenError if user does not own the reptile', async () => {
      mockMeasurementRepo.findById.mockResolvedValue({
        ...mockMeasurement,
        reptile: { ...mockReptile, userId: 'other-user' },
      })

      await expect(service.getById(userId, measurementId)).rejects.toThrow(ForbiddenError)
    })

    it('should allow access to measurement even if reptile is soft-deleted', async () => {
      // Note: verifyRecordOwnership only checks if the record itself is deleted,
      // not the parent reptile. This may be intentional for historical data access.
      mockMeasurementRepo.findById.mockResolvedValue({
        ...mockMeasurement,
        reptile: { ...mockReptile, deletedAt: new Date() },
      })

      const result = await service.getById(userId, measurementId)

      expect(result.id).toBe(measurementId)
    })
  })

  describe('create', () => {
    const validInput = {
      date: '2025-01-15',
      type: 'WEIGHT',
      value: 450.5,
      unit: 'g',
    }

    it('should create a measurement for a reptile owned by the user', async () => {
      mockReptileRepo.findById.mockResolvedValue(mockReptile)
      mockMeasurementRepo.create.mockResolvedValue(mockMeasurement)

      const result = await service.create(userId, reptileId, validInput)

      expect(result.id).toBe(measurementId)
      expect(mockMeasurementRepo.create).toHaveBeenCalled()
    })

    it('should throw NotFoundError if reptile does not exist', async () => {
      mockReptileRepo.findById.mockResolvedValue(null)

      await expect(service.create(userId, reptileId, validInput)).rejects.toThrow(NotFoundError)
    })

    it('should throw ForbiddenError if user does not own the reptile', async () => {
      mockReptileRepo.findById.mockResolvedValue({ ...mockReptile, userId: 'other-user' })

      await expect(service.create(userId, reptileId, validInput)).rejects.toThrow(ForbiddenError)
    })

    it('should throw ValidationError for missing required fields', async () => {
      mockReptileRepo.findById.mockResolvedValue(mockReptile)

      const invalidInput = { type: 'WEIGHT' } // Missing date, value, unit

      await expect(service.create(userId, reptileId, invalidInput)).rejects.toThrow(ValidationError)
    })

    it('should throw ValidationError for invalid measurement type', async () => {
      mockReptileRepo.findById.mockResolvedValue(mockReptile)

      const invalidInput = { ...validInput, type: 'INVALID_TYPE' }

      await expect(service.create(userId, reptileId, invalidInput)).rejects.toThrow(ValidationError)
    })

    it('should throw ValidationError for negative value', async () => {
      mockReptileRepo.findById.mockResolvedValue(mockReptile)

      const invalidInput = { ...validInput, value: -100 }

      await expect(service.create(userId, reptileId, invalidInput)).rejects.toThrow(ValidationError)
    })

    it('should throw NotFoundError if reptile is deleted', async () => {
      mockReptileRepo.findById.mockResolvedValue({ ...mockReptile, deletedAt: new Date() })

      await expect(service.create(userId, reptileId, validInput)).rejects.toThrow(NotFoundError)
    })

    it('should create measurement with optional notes', async () => {
      mockReptileRepo.findById.mockResolvedValue(mockReptile)
      mockMeasurementRepo.create.mockResolvedValue({
        ...mockMeasurement,
        notes: 'Post-feeding weight',
      })

      const inputWithNotes = { ...validInput, notes: 'Post-feeding weight' }
      const result = await service.create(userId, reptileId, inputWithNotes)

      expect(result.notes).toBe('Post-feeding weight')
    })

    it('should create measurement with client-provided cuid2 id', async () => {
      // Must be a valid CUID2 format for offline-created records
      const customId = 'clhp2k3n40000vlx48s7v5qxn'
      mockReptileRepo.findById.mockResolvedValue(mockReptile)
      mockMeasurementRepo.create.mockResolvedValue({
        ...mockMeasurement,
        id: customId,
      })

      const inputWithId = { ...validInput, id: customId }
      await service.create(userId, reptileId, inputWithId)

      expect(mockMeasurementRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          id: customId,
        })
      )
    })
  })

  describe('update', () => {
    const updateInput = {
      value: 475,
      notes: 'Updated weight',
    }

    it('should update a measurement if user owns the reptile', async () => {
      mockMeasurementRepo.findById.mockResolvedValue({ ...mockMeasurement, reptile: mockReptile })
      mockMeasurementRepo.update.mockResolvedValue({ ...mockMeasurement, ...updateInput })

      const result = await service.update(userId, measurementId, updateInput)

      expect(result.value).toBe(475)
      expect(result.notes).toBe('Updated weight')
    })

    it('should throw NotFoundError if measurement does not exist', async () => {
      mockMeasurementRepo.findById.mockResolvedValue(null)

      await expect(service.update(userId, measurementId, updateInput)).rejects.toThrow(
        NotFoundError
      )
    })

    it('should throw ForbiddenError if user does not own the reptile', async () => {
      mockMeasurementRepo.findById.mockResolvedValue({
        ...mockMeasurement,
        reptile: { ...mockReptile, userId: 'other-user' },
      })

      await expect(service.update(userId, measurementId, updateInput)).rejects.toThrow(
        ForbiddenError
      )
    })

    it('should throw ValidationError for invalid update data', async () => {
      mockMeasurementRepo.findById.mockResolvedValue({ ...mockMeasurement, reptile: mockReptile })

      const invalidInput = { value: -100 } // Negative value not allowed

      await expect(service.update(userId, measurementId, invalidInput)).rejects.toThrow(
        ValidationError
      )
    })

    it('should update measurement type', async () => {
      mockMeasurementRepo.findById.mockResolvedValue({ ...mockMeasurement, reptile: mockReptile })
      mockMeasurementRepo.update.mockResolvedValue({
        ...mockMeasurement,
        type: 'LENGTH' as MeasurementType,
      })

      const result = await service.update(userId, measurementId, { type: 'LENGTH' })

      expect(result.type).toBe('LENGTH')
    })

    it('should update measurement unit', async () => {
      mockMeasurementRepo.findById.mockResolvedValue({ ...mockMeasurement, reptile: mockReptile })
      mockMeasurementRepo.update.mockResolvedValue({ ...mockMeasurement, unit: 'oz' })

      const result = await service.update(userId, measurementId, { unit: 'oz' })

      expect(result.unit).toBe('oz')
    })

    it('should update measurement date', async () => {
      const newDate = new Date('2025-02-01')
      mockMeasurementRepo.findById.mockResolvedValue({ ...mockMeasurement, reptile: mockReptile })
      mockMeasurementRepo.update.mockResolvedValue({ ...mockMeasurement, date: newDate })

      const result = await service.update(userId, measurementId, { date: '2025-02-01' })

      expect(result.date).toEqual(newDate)
    })

    it('should allow update even if reptile is soft-deleted', async () => {
      // Note: verifyRecordOwnership only checks if the record itself is deleted,
      // not the parent reptile. This may be intentional for historical data access.
      mockMeasurementRepo.findById.mockResolvedValue({
        ...mockMeasurement,
        reptile: { ...mockReptile, deletedAt: new Date() },
      })
      mockMeasurementRepo.update.mockResolvedValue({ ...mockMeasurement, ...updateInput })

      const result = await service.update(userId, measurementId, updateInput)

      expect(result.value).toBe(475)
    })
  })

  describe('delete', () => {
    it('should delete a measurement if user owns the reptile', async () => {
      mockMeasurementRepo.findById.mockResolvedValue({ ...mockMeasurement, reptile: mockReptile })
      mockMeasurementRepo.delete.mockResolvedValue(mockMeasurement)

      const result = await service.delete(userId, measurementId)

      expect(result.id).toBe(measurementId)
      expect(mockMeasurementRepo.delete).toHaveBeenCalledWith(measurementId)
    })

    it('should throw NotFoundError if measurement does not exist', async () => {
      mockMeasurementRepo.findById.mockResolvedValue(null)

      await expect(service.delete(userId, measurementId)).rejects.toThrow(NotFoundError)
    })

    it('should throw ForbiddenError if user does not own the reptile', async () => {
      mockMeasurementRepo.findById.mockResolvedValue({
        ...mockMeasurement,
        reptile: { ...mockReptile, userId: 'other-user' },
      })

      await expect(service.delete(userId, measurementId)).rejects.toThrow(ForbiddenError)
    })

    it('should allow delete even if reptile is soft-deleted', async () => {
      // Note: verifyRecordOwnership only checks if the record itself is deleted,
      // not the parent reptile. This may be intentional for historical data access.
      mockMeasurementRepo.findById.mockResolvedValue({
        ...mockMeasurement,
        reptile: { ...mockReptile, deletedAt: new Date() },
      })
      mockMeasurementRepo.delete.mockResolvedValue(mockMeasurement)

      const result = await service.delete(userId, measurementId)

      expect(result.id).toBe(measurementId)
    })
  })
})
