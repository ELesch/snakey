// Vet Service Tests - TDD Red Phase
import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  VetService,
  NotFoundError,
  ForbiddenError,
  ValidationError,
} from './vet.service'

// Mock the repositories
vi.mock('@/repositories/vet.repository', () => ({
  VetRepository: vi.fn().mockImplementation(() => ({
    findManyVisits: vi.fn(),
    countVisits: vi.fn(),
    findVisitById: vi.fn(),
    createVisit: vi.fn(),
    updateVisit: vi.fn(),
    deleteVisit: vi.fn(),
    findManyMedications: vi.fn(),
    countMedications: vi.fn(),
    findMedicationById: vi.fn(),
    createMedication: vi.fn(),
    updateMedication: vi.fn(),
    deleteMedication: vi.fn(),
    findActiveMedications: vi.fn(),
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

describe('VetService', () => {
  let service: VetService
  let mockVetRepo: {
    findManyVisits: ReturnType<typeof vi.fn>
    countVisits: ReturnType<typeof vi.fn>
    findVisitById: ReturnType<typeof vi.fn>
    createVisit: ReturnType<typeof vi.fn>
    updateVisit: ReturnType<typeof vi.fn>
    deleteVisit: ReturnType<typeof vi.fn>
    findManyMedications: ReturnType<typeof vi.fn>
    countMedications: ReturnType<typeof vi.fn>
    findMedicationById: ReturnType<typeof vi.fn>
    createMedication: ReturnType<typeof vi.fn>
    updateMedication: ReturnType<typeof vi.fn>
    deleteMedication: ReturnType<typeof vi.fn>
    findActiveMedications: ReturnType<typeof vi.fn>
  }
  let mockReptileRepo: {
    findById: ReturnType<typeof vi.fn>
  }

  const userId = 'user-123'
  const reptileId = 'reptile-456'
  const visitId = 'visit-789'
  const medicationId = 'med-101'

  const mockReptile = {
    id: reptileId,
    userId,
    name: 'Monty',
    species: 'Ball Python',
    deletedAt: null,
  }

  const mockVetVisit = {
    id: visitId,
    reptileId,
    date: new Date('2025-01-15'),
    reason: 'Annual checkup',
    diagnosis: 'Healthy',
    treatment: null,
    vetName: 'Dr. Snake',
    vetClinic: 'Reptile Clinic',
    cost: 150.00,
    followUp: null,
    notes: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  const mockMedication = {
    id: medicationId,
    reptileId,
    name: 'Antibiotics',
    dosage: '0.5ml',
    frequency: 'Twice daily',
    startDate: new Date('2025-01-15'),
    endDate: new Date('2025-01-22'),
    notes: null,
    reminders: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  beforeEach(async () => {
    vi.clearAllMocks()

    service = new VetService()

    // Access the mocked repositories
    mockVetRepo = (service as unknown as { vetRepository: typeof mockVetRepo }).vetRepository
    mockReptileRepo = (service as unknown as { reptileRepository: typeof mockReptileRepo }).reptileRepository
  })

  // ============================================================================
  // VET VISIT TESTS
  // ============================================================================

  describe('listVisits', () => {
    it('should list vet visits for a reptile owned by the user', async () => {
      mockReptileRepo.findById.mockResolvedValue(mockReptile)
      mockVetRepo.findManyVisits.mockResolvedValue([mockVetVisit])
      mockVetRepo.countVisits.mockResolvedValue(1)

      const result = await service.listVisits(userId, reptileId, {})

      expect(result.data).toHaveLength(1)
      expect(result.data[0].id).toBe(visitId)
      expect(result.meta.total).toBe(1)
    })

    it('should throw NotFoundError if reptile does not exist', async () => {
      mockReptileRepo.findById.mockResolvedValue(null)

      await expect(service.listVisits(userId, reptileId, {})).rejects.toThrow(NotFoundError)
    })

    it('should throw ForbiddenError if user does not own the reptile', async () => {
      mockReptileRepo.findById.mockResolvedValue({ ...mockReptile, userId: 'other-user' })

      await expect(service.listVisits(userId, reptileId, {})).rejects.toThrow(ForbiddenError)
    })

    it('should support pagination', async () => {
      mockReptileRepo.findById.mockResolvedValue(mockReptile)
      mockVetRepo.findManyVisits.mockResolvedValue([mockVetVisit])
      mockVetRepo.countVisits.mockResolvedValue(25)

      const result = await service.listVisits(userId, reptileId, { page: 2, limit: 10 })

      expect(result.meta.page).toBe(2)
      expect(result.meta.limit).toBe(10)
      expect(result.meta.totalPages).toBe(3)
      expect(result.meta.hasNext).toBe(true)
      expect(result.meta.hasPrev).toBe(true)
    })

    it('should support date filtering', async () => {
      mockReptileRepo.findById.mockResolvedValue(mockReptile)
      mockVetRepo.findManyVisits.mockResolvedValue([mockVetVisit])
      mockVetRepo.countVisits.mockResolvedValue(1)

      const startDate = new Date('2025-01-01')
      const endDate = new Date('2025-01-31')

      await service.listVisits(userId, reptileId, { startDate, endDate })

      expect(mockVetRepo.findManyVisits).toHaveBeenCalledWith(
        expect.objectContaining({
          startDate,
          endDate,
        })
      )
    })
  })

  describe('getVisitById', () => {
    it('should return a vet visit if user owns the reptile', async () => {
      mockVetRepo.findVisitById.mockResolvedValue({ ...mockVetVisit, reptile: mockReptile })

      const result = await service.getVisitById(userId, visitId)

      expect(result.id).toBe(visitId)
    })

    it('should throw NotFoundError if visit does not exist', async () => {
      mockVetRepo.findVisitById.mockResolvedValue(null)

      await expect(service.getVisitById(userId, visitId)).rejects.toThrow(NotFoundError)
    })

    it('should throw ForbiddenError if user does not own the reptile', async () => {
      mockVetRepo.findVisitById.mockResolvedValue({
        ...mockVetVisit,
        reptile: { ...mockReptile, userId: 'other-user' },
      })

      await expect(service.getVisitById(userId, visitId)).rejects.toThrow(ForbiddenError)
    })
  })

  describe('createVisit', () => {
    const validInput = {
      date: '2025-01-15',
      reason: 'Annual checkup',
      vetName: 'Dr. Snake',
      vetClinic: 'Reptile Clinic',
    }

    it('should create a vet visit for a reptile owned by the user', async () => {
      mockReptileRepo.findById.mockResolvedValue(mockReptile)
      mockVetRepo.createVisit.mockResolvedValue(mockVetVisit)

      const result = await service.createVisit(userId, reptileId, validInput)

      expect(result.id).toBe(visitId)
      expect(mockVetRepo.createVisit).toHaveBeenCalled()
    })

    it('should throw NotFoundError if reptile does not exist', async () => {
      mockReptileRepo.findById.mockResolvedValue(null)

      await expect(service.createVisit(userId, reptileId, validInput)).rejects.toThrow(NotFoundError)
    })

    it('should throw ForbiddenError if user does not own the reptile', async () => {
      mockReptileRepo.findById.mockResolvedValue({ ...mockReptile, userId: 'other-user' })

      await expect(service.createVisit(userId, reptileId, validInput)).rejects.toThrow(ForbiddenError)
    })

    it('should throw ValidationError for invalid input', async () => {
      mockReptileRepo.findById.mockResolvedValue(mockReptile)

      const invalidInput = { reason: '' } // Missing required fields

      await expect(service.createVisit(userId, reptileId, invalidInput)).rejects.toThrow(ValidationError)
    })

    it('should throw NotFoundError if reptile is deleted', async () => {
      mockReptileRepo.findById.mockResolvedValue({ ...mockReptile, deletedAt: new Date() })

      await expect(service.createVisit(userId, reptileId, validInput)).rejects.toThrow(NotFoundError)
    })
  })

  describe('updateVisit', () => {
    const updateInput = {
      diagnosis: 'Healthy with minor scale issue',
      notes: 'Follow up in 2 weeks',
    }

    it('should update a vet visit if user owns the reptile', async () => {
      mockVetRepo.findVisitById.mockResolvedValue({ ...mockVetVisit, reptile: mockReptile })
      mockVetRepo.updateVisit.mockResolvedValue({ ...mockVetVisit, ...updateInput })

      const result = await service.updateVisit(userId, visitId, updateInput)

      expect(result.diagnosis).toBe('Healthy with minor scale issue')
      expect(result.notes).toBe('Follow up in 2 weeks')
    })

    it('should throw NotFoundError if visit does not exist', async () => {
      mockVetRepo.findVisitById.mockResolvedValue(null)

      await expect(service.updateVisit(userId, visitId, updateInput)).rejects.toThrow(NotFoundError)
    })

    it('should throw ForbiddenError if user does not own the reptile', async () => {
      mockVetRepo.findVisitById.mockResolvedValue({
        ...mockVetVisit,
        reptile: { ...mockReptile, userId: 'other-user' },
      })

      await expect(service.updateVisit(userId, visitId, updateInput)).rejects.toThrow(ForbiddenError)
    })

    it('should throw ValidationError for invalid input', async () => {
      mockVetRepo.findVisitById.mockResolvedValue({ ...mockVetVisit, reptile: mockReptile })

      const invalidInput = { reason: '' } // Empty string not allowed

      await expect(service.updateVisit(userId, visitId, invalidInput)).rejects.toThrow(ValidationError)
    })
  })

  describe('deleteVisit', () => {
    it('should delete a vet visit if user owns the reptile', async () => {
      mockVetRepo.findVisitById.mockResolvedValue({ ...mockVetVisit, reptile: mockReptile })
      mockVetRepo.deleteVisit.mockResolvedValue(mockVetVisit)

      const result = await service.deleteVisit(userId, visitId)

      expect(result.id).toBe(visitId)
      expect(mockVetRepo.deleteVisit).toHaveBeenCalledWith(visitId)
    })

    it('should throw NotFoundError if visit does not exist', async () => {
      mockVetRepo.findVisitById.mockResolvedValue(null)

      await expect(service.deleteVisit(userId, visitId)).rejects.toThrow(NotFoundError)
    })

    it('should throw ForbiddenError if user does not own the reptile', async () => {
      mockVetRepo.findVisitById.mockResolvedValue({
        ...mockVetVisit,
        reptile: { ...mockReptile, userId: 'other-user' },
      })

      await expect(service.deleteVisit(userId, visitId)).rejects.toThrow(ForbiddenError)
    })
  })

  // ============================================================================
  // MEDICATION TESTS
  // ============================================================================

  describe('listMedications', () => {
    it('should list medications for a reptile owned by the user', async () => {
      mockReptileRepo.findById.mockResolvedValue(mockReptile)
      mockVetRepo.findManyMedications.mockResolvedValue([mockMedication])
      mockVetRepo.countMedications.mockResolvedValue(1)

      const result = await service.listMedications(userId, reptileId, {})

      expect(result.data).toHaveLength(1)
      expect(result.data[0].id).toBe(medicationId)
      expect(result.meta.total).toBe(1)
    })

    it('should throw NotFoundError if reptile does not exist', async () => {
      mockReptileRepo.findById.mockResolvedValue(null)

      await expect(service.listMedications(userId, reptileId, {})).rejects.toThrow(NotFoundError)
    })

    it('should throw ForbiddenError if user does not own the reptile', async () => {
      mockReptileRepo.findById.mockResolvedValue({ ...mockReptile, userId: 'other-user' })

      await expect(service.listMedications(userId, reptileId, {})).rejects.toThrow(ForbiddenError)
    })

    it('should support pagination', async () => {
      mockReptileRepo.findById.mockResolvedValue(mockReptile)
      mockVetRepo.findManyMedications.mockResolvedValue([mockMedication])
      mockVetRepo.countMedications.mockResolvedValue(25)

      const result = await service.listMedications(userId, reptileId, { page: 2, limit: 10 })

      expect(result.meta.page).toBe(2)
      expect(result.meta.limit).toBe(10)
      expect(result.meta.totalPages).toBe(3)
    })
  })

  describe('getMedicationById', () => {
    it('should return a medication if user owns the reptile', async () => {
      mockVetRepo.findMedicationById.mockResolvedValue({ ...mockMedication, reptile: mockReptile })

      const result = await service.getMedicationById(userId, medicationId)

      expect(result.id).toBe(medicationId)
    })

    it('should throw NotFoundError if medication does not exist', async () => {
      mockVetRepo.findMedicationById.mockResolvedValue(null)

      await expect(service.getMedicationById(userId, medicationId)).rejects.toThrow(NotFoundError)
    })

    it('should throw ForbiddenError if user does not own the reptile', async () => {
      mockVetRepo.findMedicationById.mockResolvedValue({
        ...mockMedication,
        reptile: { ...mockReptile, userId: 'other-user' },
      })

      await expect(service.getMedicationById(userId, medicationId)).rejects.toThrow(ForbiddenError)
    })
  })

  describe('createMedication', () => {
    const validInput = {
      name: 'Antibiotics',
      dosage: '0.5ml',
      frequency: 'Twice daily',
      startDate: '2025-01-15',
      endDate: '2025-01-22',
      reminders: true,
    }

    it('should create a medication for a reptile owned by the user', async () => {
      mockReptileRepo.findById.mockResolvedValue(mockReptile)
      mockVetRepo.createMedication.mockResolvedValue(mockMedication)

      const result = await service.createMedication(userId, reptileId, validInput)

      expect(result.id).toBe(medicationId)
      expect(mockVetRepo.createMedication).toHaveBeenCalled()
    })

    it('should throw NotFoundError if reptile does not exist', async () => {
      mockReptileRepo.findById.mockResolvedValue(null)

      await expect(service.createMedication(userId, reptileId, validInput)).rejects.toThrow(NotFoundError)
    })

    it('should throw ForbiddenError if user does not own the reptile', async () => {
      mockReptileRepo.findById.mockResolvedValue({ ...mockReptile, userId: 'other-user' })

      await expect(service.createMedication(userId, reptileId, validInput)).rejects.toThrow(ForbiddenError)
    })

    it('should throw ValidationError for invalid input', async () => {
      mockReptileRepo.findById.mockResolvedValue(mockReptile)

      const invalidInput = { name: '' } // Missing required fields

      await expect(service.createMedication(userId, reptileId, invalidInput)).rejects.toThrow(ValidationError)
    })

    it('should throw NotFoundError if reptile is deleted', async () => {
      mockReptileRepo.findById.mockResolvedValue({ ...mockReptile, deletedAt: new Date() })

      await expect(service.createMedication(userId, reptileId, validInput)).rejects.toThrow(NotFoundError)
    })
  })

  describe('updateMedication', () => {
    const updateInput = {
      dosage: '1ml',
      notes: 'Increased dosage per vet recommendation',
    }

    it('should update a medication if user owns the reptile', async () => {
      mockVetRepo.findMedicationById.mockResolvedValue({ ...mockMedication, reptile: mockReptile })
      mockVetRepo.updateMedication.mockResolvedValue({ ...mockMedication, ...updateInput })

      const result = await service.updateMedication(userId, medicationId, updateInput)

      expect(result.dosage).toBe('1ml')
      expect(result.notes).toBe('Increased dosage per vet recommendation')
    })

    it('should throw NotFoundError if medication does not exist', async () => {
      mockVetRepo.findMedicationById.mockResolvedValue(null)

      await expect(service.updateMedication(userId, medicationId, updateInput)).rejects.toThrow(NotFoundError)
    })

    it('should throw ForbiddenError if user does not own the reptile', async () => {
      mockVetRepo.findMedicationById.mockResolvedValue({
        ...mockMedication,
        reptile: { ...mockReptile, userId: 'other-user' },
      })

      await expect(service.updateMedication(userId, medicationId, updateInput)).rejects.toThrow(ForbiddenError)
    })

    it('should throw ValidationError for invalid input', async () => {
      mockVetRepo.findMedicationById.mockResolvedValue({ ...mockMedication, reptile: mockReptile })

      const invalidInput = { name: '' } // Empty string not allowed

      await expect(service.updateMedication(userId, medicationId, invalidInput)).rejects.toThrow(ValidationError)
    })
  })

  describe('deleteMedication', () => {
    it('should delete a medication if user owns the reptile', async () => {
      mockVetRepo.findMedicationById.mockResolvedValue({ ...mockMedication, reptile: mockReptile })
      mockVetRepo.deleteMedication.mockResolvedValue(mockMedication)

      const result = await service.deleteMedication(userId, medicationId)

      expect(result.id).toBe(medicationId)
      expect(mockVetRepo.deleteMedication).toHaveBeenCalledWith(medicationId)
    })

    it('should throw NotFoundError if medication does not exist', async () => {
      mockVetRepo.findMedicationById.mockResolvedValue(null)

      await expect(service.deleteMedication(userId, medicationId)).rejects.toThrow(NotFoundError)
    })

    it('should throw ForbiddenError if user does not own the reptile', async () => {
      mockVetRepo.findMedicationById.mockResolvedValue({
        ...mockMedication,
        reptile: { ...mockReptile, userId: 'other-user' },
      })

      await expect(service.deleteMedication(userId, medicationId)).rejects.toThrow(ForbiddenError)
    })
  })

  // ============================================================================
  // MEDICATION SCHEDULE TESTS
  // ============================================================================

  describe('getMedicationSchedule', () => {
    it('should return active medications for a reptile', async () => {
      mockReptileRepo.findById.mockResolvedValue(mockReptile)
      mockVetRepo.findActiveMedications.mockResolvedValue([mockMedication])

      const result = await service.getMedicationSchedule(userId, reptileId)

      expect(result).toHaveLength(1)
      expect(result[0].id).toBe(medicationId)
    })

    it('should throw NotFoundError if reptile does not exist', async () => {
      mockReptileRepo.findById.mockResolvedValue(null)

      await expect(service.getMedicationSchedule(userId, reptileId)).rejects.toThrow(NotFoundError)
    })

    it('should throw ForbiddenError if user does not own the reptile', async () => {
      mockReptileRepo.findById.mockResolvedValue({ ...mockReptile, userId: 'other-user' })

      await expect(service.getMedicationSchedule(userId, reptileId)).rejects.toThrow(ForbiddenError)
    })

    it('should return empty array if no active medications', async () => {
      mockReptileRepo.findById.mockResolvedValue(mockReptile)
      mockVetRepo.findActiveMedications.mockResolvedValue([])

      const result = await service.getMedicationSchedule(userId, reptileId)

      expect(result).toHaveLength(0)
    })
  })
})
