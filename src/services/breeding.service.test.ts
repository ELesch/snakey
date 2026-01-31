// Breeding Service Tests - TDD Red Phase
import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  PairingService,
  ClutchService,
  HatchlingService,
  NotFoundError,
  ForbiddenError,
  ValidationError,
} from './breeding.service'

// Mock the repository
vi.mock('@/repositories/breeding.repository', () => ({
  PairingRepository: vi.fn().mockImplementation(() => ({
    findMany: vi.fn(),
    count: vi.fn(),
    findById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  })),
  ClutchRepository: vi.fn().mockImplementation(() => ({
    findMany: vi.fn(),
    count: vi.fn(),
    findById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  })),
  HatchlingRepository: vi.fn().mockImplementation(() => ({
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

// ============================================================================
// PAIRING SERVICE TESTS
// ============================================================================

describe('PairingService', () => {
  let service: PairingService
  let mockPairingRepo: {
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

  // Use CUID2-compatible IDs (25 chars, lowercase alphanumeric)
  const userId = 'cuid2user00000000000001'
  const maleId = 'cuid2male00000000000001'
  const femaleId = 'cuid2female000000000001'
  const pairingId = 'cuid2pairing0000000001'
  const newMaleId = 'cuid2newmale0000000001'
  const newFemaleId = 'cuid2newfemale00000001'

  const mockMaleReptile = {
    id: maleId,
    userId,
    name: 'Zeus',
    species: 'Ball Python',
    sex: 'MALE',
    deletedAt: null,
  }

  const mockFemaleReptile = {
    id: femaleId,
    userId,
    name: 'Hera',
    species: 'Ball Python',
    sex: 'FEMALE',
    deletedAt: null,
  }

  const mockPairing = {
    id: pairingId,
    userId,
    maleId,
    femaleId,
    startDate: new Date('2025-01-15'),
    endDate: null,
    successful: null,
    notes: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    male: mockMaleReptile,
    female: mockFemaleReptile,
  }

  beforeEach(async () => {
    vi.clearAllMocks()

    service = new PairingService()

    // Access the mocked repositories
    mockPairingRepo = (service as unknown as { pairingRepository: typeof mockPairingRepo }).pairingRepository
    mockReptileRepo = (service as unknown as { reptileRepository: typeof mockReptileRepo }).reptileRepository
  })

  describe('list', () => {
    it('should list pairings for the user', async () => {
      mockPairingRepo.findMany.mockResolvedValue([mockPairing])
      mockPairingRepo.count.mockResolvedValue(1)

      const result = await service.list(userId, {})

      expect(result.data).toHaveLength(1)
      expect(result.data[0].id).toBe(pairingId)
      expect(result.meta.total).toBe(1)
    })

    it('should support pagination', async () => {
      mockPairingRepo.findMany.mockResolvedValue([mockPairing])
      mockPairingRepo.count.mockResolvedValue(25)

      const result = await service.list(userId, { page: 2, limit: 10 })

      expect(result.meta.page).toBe(2)
      expect(result.meta.limit).toBe(10)
      expect(result.meta.totalPages).toBe(3)
      expect(result.meta.hasNext).toBe(true)
      expect(result.meta.hasPrev).toBe(true)
    })

    it('should support date filtering', async () => {
      mockPairingRepo.findMany.mockResolvedValue([mockPairing])
      mockPairingRepo.count.mockResolvedValue(1)

      const startDate = new Date('2025-01-01')
      const endDate = new Date('2025-01-31')

      await service.list(userId, { startDate, endDate })

      expect(mockPairingRepo.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          startDate,
          endDate,
        })
      )
    })
  })

  describe('getById', () => {
    it('should return a pairing if user owns it', async () => {
      mockPairingRepo.findById.mockResolvedValue(mockPairing)

      const result = await service.getById(userId, pairingId)

      expect(result.id).toBe(pairingId)
    })

    it('should throw NotFoundError if pairing does not exist', async () => {
      mockPairingRepo.findById.mockResolvedValue(null)

      await expect(service.getById(userId, pairingId)).rejects.toThrow(NotFoundError)
    })

    it('should throw ForbiddenError if user does not own the pairing', async () => {
      mockPairingRepo.findById.mockResolvedValue({ ...mockPairing, userId: 'other-user' })

      await expect(service.getById(userId, pairingId)).rejects.toThrow(ForbiddenError)
    })
  })

  describe('create', () => {
    const validInput = {
      maleId,
      femaleId,
      startDate: '2025-01-15',
    }

    it('should create a pairing when user owns both reptiles', async () => {
      mockReptileRepo.findById
        .mockResolvedValueOnce(mockMaleReptile)
        .mockResolvedValueOnce(mockFemaleReptile)
      mockPairingRepo.create.mockResolvedValue(mockPairing)

      const result = await service.create(userId, validInput)

      expect(result.id).toBe(pairingId)
      expect(mockPairingRepo.create).toHaveBeenCalled()
    })

    it('should throw NotFoundError if male reptile does not exist', async () => {
      mockReptileRepo.findById.mockResolvedValueOnce(null)

      await expect(service.create(userId, validInput)).rejects.toThrow(NotFoundError)
    })

    it('should throw NotFoundError if female reptile does not exist', async () => {
      mockReptileRepo.findById
        .mockResolvedValueOnce(mockMaleReptile)
        .mockResolvedValueOnce(null)

      await expect(service.create(userId, validInput)).rejects.toThrow(NotFoundError)
    })

    it('should throw ForbiddenError if user does not own male reptile', async () => {
      mockReptileRepo.findById.mockResolvedValueOnce({ ...mockMaleReptile, userId: 'other-user' })

      await expect(service.create(userId, validInput)).rejects.toThrow(ForbiddenError)
    })

    it('should throw ForbiddenError if user does not own female reptile', async () => {
      mockReptileRepo.findById
        .mockResolvedValueOnce(mockMaleReptile)
        .mockResolvedValueOnce({ ...mockFemaleReptile, userId: 'other-user' })

      await expect(service.create(userId, validInput)).rejects.toThrow(ForbiddenError)
    })

    it('should throw ValidationError for invalid input', async () => {
      mockReptileRepo.findById
        .mockResolvedValueOnce(mockMaleReptile)
        .mockResolvedValueOnce(mockFemaleReptile)

      const invalidInput = { maleId: 'invalid' } // Missing required fields

      await expect(service.create(userId, invalidInput)).rejects.toThrow(ValidationError)
    })

    it('should throw NotFoundError if male reptile is deleted', async () => {
      mockReptileRepo.findById.mockResolvedValueOnce({ ...mockMaleReptile, deletedAt: new Date() })

      await expect(service.create(userId, validInput)).rejects.toThrow(NotFoundError)
    })

    it('should throw NotFoundError if female reptile is deleted', async () => {
      mockReptileRepo.findById
        .mockResolvedValueOnce(mockMaleReptile)
        .mockResolvedValueOnce({ ...mockFemaleReptile, deletedAt: new Date() })

      await expect(service.create(userId, validInput)).rejects.toThrow(NotFoundError)
    })
  })

  describe('update', () => {
    const updateInput = {
      successful: true,
      notes: 'Successful breeding',
    }

    it('should update a pairing if user owns it', async () => {
      mockPairingRepo.findById.mockResolvedValue(mockPairing)
      mockPairingRepo.update.mockResolvedValue({ ...mockPairing, ...updateInput })

      const result = await service.update(userId, pairingId, updateInput)

      expect(result.successful).toBe(true)
      expect(result.notes).toBe('Successful breeding')
    })

    it('should throw NotFoundError if pairing does not exist', async () => {
      mockPairingRepo.findById.mockResolvedValue(null)

      await expect(service.update(userId, pairingId, updateInput)).rejects.toThrow(NotFoundError)
    })

    it('should throw ForbiddenError if user does not own the pairing', async () => {
      mockPairingRepo.findById.mockResolvedValue({ ...mockPairing, userId: 'other-user' })

      await expect(service.update(userId, pairingId, updateInput)).rejects.toThrow(ForbiddenError)
    })

    it('should verify new male ownership when maleId is updated', async () => {
      mockPairingRepo.findById.mockResolvedValue(mockPairing)
      mockReptileRepo.findById.mockResolvedValue({ ...mockMaleReptile, id: newMaleId })
      mockPairingRepo.update.mockResolvedValue({ ...mockPairing, maleId: newMaleId })

      await service.update(userId, pairingId, { maleId: newMaleId })

      expect(mockReptileRepo.findById).toHaveBeenCalledWith(newMaleId)
    })

    it('should verify new female ownership when femaleId is updated', async () => {
      mockPairingRepo.findById.mockResolvedValue(mockPairing)
      mockReptileRepo.findById.mockResolvedValue({ ...mockFemaleReptile, id: newFemaleId })
      mockPairingRepo.update.mockResolvedValue({ ...mockPairing, femaleId: newFemaleId })

      await service.update(userId, pairingId, { femaleId: newFemaleId })

      expect(mockReptileRepo.findById).toHaveBeenCalledWith(newFemaleId)
    })
  })

  describe('delete', () => {
    it('should delete a pairing if user owns it', async () => {
      mockPairingRepo.findById.mockResolvedValue(mockPairing)
      mockPairingRepo.delete.mockResolvedValue(mockPairing)

      const result = await service.delete(userId, pairingId)

      expect(result.id).toBe(pairingId)
      expect(mockPairingRepo.delete).toHaveBeenCalledWith(pairingId)
    })

    it('should throw NotFoundError if pairing does not exist', async () => {
      mockPairingRepo.findById.mockResolvedValue(null)

      await expect(service.delete(userId, pairingId)).rejects.toThrow(NotFoundError)
    })

    it('should throw ForbiddenError if user does not own the pairing', async () => {
      mockPairingRepo.findById.mockResolvedValue({ ...mockPairing, userId: 'other-user' })

      await expect(service.delete(userId, pairingId)).rejects.toThrow(ForbiddenError)
    })
  })
})

// ============================================================================
// CLUTCH SERVICE TESTS
// ============================================================================

describe('ClutchService', () => {
  let service: ClutchService
  let mockClutchRepo: {
    findMany: ReturnType<typeof vi.fn>
    count: ReturnType<typeof vi.fn>
    findById: ReturnType<typeof vi.fn>
    create: ReturnType<typeof vi.fn>
    update: ReturnType<typeof vi.fn>
    delete: ReturnType<typeof vi.fn>
  }
  let mockPairingRepo: {
    findById: ReturnType<typeof vi.fn>
  }

  // Use CUID2-compatible IDs (25 chars, lowercase alphanumeric)
  const userId = 'cuid2user00000000000001'
  const pairingId = 'cuid2pairing0000000001'
  const clutchId = 'cuid2clutch000000000001'

  const mockPairing = {
    id: pairingId,
    userId,
    maleId: 'cuid2male00000000000001',
    femaleId: 'cuid2female000000000001',
    startDate: new Date('2025-01-15'),
    endDate: null,
    successful: null,
    notes: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  const mockClutch = {
    id: clutchId,
    pairingId,
    layDate: new Date('2025-02-01'),
    eggCount: 8,
    fertileCount: 6,
    incubationTemp: null,
    dueDate: null,
    notes: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    pairing: mockPairing,
  }

  beforeEach(async () => {
    vi.clearAllMocks()

    service = new ClutchService()

    // Access the mocked repositories
    mockClutchRepo = (service as unknown as { clutchRepository: typeof mockClutchRepo }).clutchRepository
    mockPairingRepo = (service as unknown as { pairingRepository: typeof mockPairingRepo }).pairingRepository
  })

  describe('list', () => {
    it('should list clutches for a pairing owned by the user', async () => {
      mockPairingRepo.findById.mockResolvedValue(mockPairing)
      mockClutchRepo.findMany.mockResolvedValue([mockClutch])
      mockClutchRepo.count.mockResolvedValue(1)

      const result = await service.list(userId, pairingId, {})

      expect(result.data).toHaveLength(1)
      expect(result.data[0].id).toBe(clutchId)
      expect(result.meta.total).toBe(1)
    })

    it('should throw NotFoundError if pairing does not exist', async () => {
      mockPairingRepo.findById.mockResolvedValue(null)

      await expect(service.list(userId, pairingId, {})).rejects.toThrow(NotFoundError)
    })

    it('should throw ForbiddenError if user does not own the pairing', async () => {
      mockPairingRepo.findById.mockResolvedValue({ ...mockPairing, userId: 'other-user' })

      await expect(service.list(userId, pairingId, {})).rejects.toThrow(ForbiddenError)
    })

    it('should support pagination', async () => {
      mockPairingRepo.findById.mockResolvedValue(mockPairing)
      mockClutchRepo.findMany.mockResolvedValue([mockClutch])
      mockClutchRepo.count.mockResolvedValue(25)

      const result = await service.list(userId, pairingId, { page: 2, limit: 10 })

      expect(result.meta.page).toBe(2)
      expect(result.meta.limit).toBe(10)
      expect(result.meta.totalPages).toBe(3)
    })
  })

  describe('getById', () => {
    it('should return a clutch if user owns the pairing', async () => {
      mockClutchRepo.findById.mockResolvedValue(mockClutch)

      const result = await service.getById(userId, clutchId)

      expect(result.id).toBe(clutchId)
    })

    it('should throw NotFoundError if clutch does not exist', async () => {
      mockClutchRepo.findById.mockResolvedValue(null)

      await expect(service.getById(userId, clutchId)).rejects.toThrow(NotFoundError)
    })

    it('should throw ForbiddenError if user does not own the pairing', async () => {
      mockClutchRepo.findById.mockResolvedValue({
        ...mockClutch,
        pairing: { ...mockPairing, userId: 'other-user' },
      })

      await expect(service.getById(userId, clutchId)).rejects.toThrow(ForbiddenError)
    })
  })

  describe('create', () => {
    const validInput = {
      layDate: '2025-02-01',
      eggCount: 8,
      fertileCount: 6,
    }

    it('should create a clutch for a pairing owned by the user', async () => {
      mockPairingRepo.findById.mockResolvedValue(mockPairing)
      mockClutchRepo.create.mockResolvedValue(mockClutch)

      const result = await service.create(userId, pairingId, validInput)

      expect(result.id).toBe(clutchId)
      expect(mockClutchRepo.create).toHaveBeenCalled()
    })

    it('should throw NotFoundError if pairing does not exist', async () => {
      mockPairingRepo.findById.mockResolvedValue(null)

      await expect(service.create(userId, pairingId, validInput)).rejects.toThrow(NotFoundError)
    })

    it('should throw ForbiddenError if user does not own the pairing', async () => {
      mockPairingRepo.findById.mockResolvedValue({ ...mockPairing, userId: 'other-user' })

      await expect(service.create(userId, pairingId, validInput)).rejects.toThrow(ForbiddenError)
    })

    it('should throw ValidationError for invalid input', async () => {
      mockPairingRepo.findById.mockResolvedValue(mockPairing)

      const invalidInput = { eggCount: 0 } // egg count must be at least 1

      await expect(service.create(userId, pairingId, invalidInput)).rejects.toThrow(ValidationError)
    })
  })

  describe('update', () => {
    const updateInput = {
      fertileCount: 7,
      notes: 'One more egg fertile',
    }

    it('should update a clutch if user owns the pairing', async () => {
      mockClutchRepo.findById.mockResolvedValue(mockClutch)
      mockClutchRepo.update.mockResolvedValue({ ...mockClutch, ...updateInput })

      const result = await service.update(userId, clutchId, updateInput)

      expect(result.fertileCount).toBe(7)
      expect(result.notes).toBe('One more egg fertile')
    })

    it('should throw NotFoundError if clutch does not exist', async () => {
      mockClutchRepo.findById.mockResolvedValue(null)

      await expect(service.update(userId, clutchId, updateInput)).rejects.toThrow(NotFoundError)
    })

    it('should throw ForbiddenError if user does not own the pairing', async () => {
      mockClutchRepo.findById.mockResolvedValue({
        ...mockClutch,
        pairing: { ...mockPairing, userId: 'other-user' },
      })

      await expect(service.update(userId, clutchId, updateInput)).rejects.toThrow(ForbiddenError)
    })
  })

  describe('delete', () => {
    it('should delete a clutch if user owns the pairing', async () => {
      mockClutchRepo.findById.mockResolvedValue(mockClutch)
      mockClutchRepo.delete.mockResolvedValue(mockClutch)

      const result = await service.delete(userId, clutchId)

      expect(result.id).toBe(clutchId)
      expect(mockClutchRepo.delete).toHaveBeenCalledWith(clutchId)
    })

    it('should throw NotFoundError if clutch does not exist', async () => {
      mockClutchRepo.findById.mockResolvedValue(null)

      await expect(service.delete(userId, clutchId)).rejects.toThrow(NotFoundError)
    })

    it('should throw ForbiddenError if user does not own the pairing', async () => {
      mockClutchRepo.findById.mockResolvedValue({
        ...mockClutch,
        pairing: { ...mockPairing, userId: 'other-user' },
      })

      await expect(service.delete(userId, clutchId)).rejects.toThrow(ForbiddenError)
    })
  })
})

// ============================================================================
// HATCHLING SERVICE TESTS
// ============================================================================

describe('HatchlingService', () => {
  let service: HatchlingService
  let mockHatchlingRepo: {
    findMany: ReturnType<typeof vi.fn>
    count: ReturnType<typeof vi.fn>
    findById: ReturnType<typeof vi.fn>
    create: ReturnType<typeof vi.fn>
    update: ReturnType<typeof vi.fn>
    delete: ReturnType<typeof vi.fn>
  }
  let mockClutchRepo: {
    findById: ReturnType<typeof vi.fn>
  }

  // Use CUID2-compatible IDs (25 chars, lowercase alphanumeric)
  const userId = 'cuid2user00000000000001'
  const clutchId = 'cuid2clutch000000000001'
  const hatchlingId = 'cuid2hatchling000000001'

  const mockPairing = {
    id: 'cuid2pairing0000000001',
    userId,
    maleId: 'cuid2male00000000000001',
    femaleId: 'cuid2female000000000001',
    startDate: new Date('2025-01-15'),
    endDate: null,
    successful: null,
    notes: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  const mockClutch = {
    id: clutchId,
    pairingId: 'cuid2pairing0000000001',
    layDate: new Date('2025-02-01'),
    eggCount: 8,
    fertileCount: 6,
    incubationTemp: null,
    dueDate: null,
    notes: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    pairing: mockPairing,
  }

  const mockHatchling = {
    id: hatchlingId,
    clutchId,
    hatchDate: new Date('2025-04-01'),
    status: 'HATCHED',
    morph: 'Pastel',
    sex: 'UNKNOWN',
    notes: null,
    reptileId: null,
    createdAt: new Date(),
    clutch: mockClutch,
  }

  beforeEach(async () => {
    vi.clearAllMocks()

    service = new HatchlingService()

    // Access the mocked repositories
    mockHatchlingRepo = (service as unknown as { hatchlingRepository: typeof mockHatchlingRepo }).hatchlingRepository
    mockClutchRepo = (service as unknown as { clutchRepository: typeof mockClutchRepo }).clutchRepository
  })

  describe('list', () => {
    it('should list hatchlings for a clutch owned by the user', async () => {
      mockClutchRepo.findById.mockResolvedValue(mockClutch)
      mockHatchlingRepo.findMany.mockResolvedValue([mockHatchling])
      mockHatchlingRepo.count.mockResolvedValue(1)

      const result = await service.list(userId, clutchId, {})

      expect(result.data).toHaveLength(1)
      expect(result.data[0].id).toBe(hatchlingId)
      expect(result.meta.total).toBe(1)
    })

    it('should throw NotFoundError if clutch does not exist', async () => {
      mockClutchRepo.findById.mockResolvedValue(null)

      await expect(service.list(userId, clutchId, {})).rejects.toThrow(NotFoundError)
    })

    it('should throw ForbiddenError if user does not own the clutch', async () => {
      mockClutchRepo.findById.mockResolvedValue({
        ...mockClutch,
        pairing: { ...mockPairing, userId: 'other-user' },
      })

      await expect(service.list(userId, clutchId, {})).rejects.toThrow(ForbiddenError)
    })

    it('should support pagination', async () => {
      mockClutchRepo.findById.mockResolvedValue(mockClutch)
      mockHatchlingRepo.findMany.mockResolvedValue([mockHatchling])
      mockHatchlingRepo.count.mockResolvedValue(25)

      const result = await service.list(userId, clutchId, { page: 2, limit: 10 })

      expect(result.meta.page).toBe(2)
      expect(result.meta.limit).toBe(10)
      expect(result.meta.totalPages).toBe(3)
    })

    it('should support status filtering', async () => {
      mockClutchRepo.findById.mockResolvedValue(mockClutch)
      mockHatchlingRepo.findMany.mockResolvedValue([mockHatchling])
      mockHatchlingRepo.count.mockResolvedValue(1)

      await service.list(userId, clutchId, { status: 'HATCHED' })

      expect(mockHatchlingRepo.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'HATCHED',
        })
      )
    })
  })

  describe('getById', () => {
    it('should return a hatchling if user owns the clutch', async () => {
      mockHatchlingRepo.findById.mockResolvedValue(mockHatchling)

      const result = await service.getById(userId, hatchlingId)

      expect(result.id).toBe(hatchlingId)
    })

    it('should throw NotFoundError if hatchling does not exist', async () => {
      mockHatchlingRepo.findById.mockResolvedValue(null)

      await expect(service.getById(userId, hatchlingId)).rejects.toThrow(NotFoundError)
    })

    it('should throw ForbiddenError if user does not own the clutch', async () => {
      mockHatchlingRepo.findById.mockResolvedValue({
        ...mockHatchling,
        clutch: {
          ...mockClutch,
          pairing: { ...mockPairing, userId: 'other-user' },
        },
      })

      await expect(service.getById(userId, hatchlingId)).rejects.toThrow(ForbiddenError)
    })
  })

  describe('create', () => {
    const validInput = {
      hatchDate: '2025-04-01',
      status: 'HATCHED',
      morph: 'Pastel',
    }

    it('should create a hatchling for a clutch owned by the user', async () => {
      mockClutchRepo.findById.mockResolvedValue(mockClutch)
      mockHatchlingRepo.create.mockResolvedValue(mockHatchling)

      const result = await service.create(userId, clutchId, validInput)

      expect(result.id).toBe(hatchlingId)
      expect(mockHatchlingRepo.create).toHaveBeenCalled()
    })

    it('should throw NotFoundError if clutch does not exist', async () => {
      mockClutchRepo.findById.mockResolvedValue(null)

      await expect(service.create(userId, clutchId, validInput)).rejects.toThrow(NotFoundError)
    })

    it('should throw ForbiddenError if user does not own the clutch', async () => {
      mockClutchRepo.findById.mockResolvedValue({
        ...mockClutch,
        pairing: { ...mockPairing, userId: 'other-user' },
      })

      await expect(service.create(userId, clutchId, validInput)).rejects.toThrow(ForbiddenError)
    })

    it('should throw ValidationError for invalid status', async () => {
      mockClutchRepo.findById.mockResolvedValue(mockClutch)

      const invalidInput = { ...validInput, status: 'INVALID' }

      await expect(service.create(userId, clutchId, invalidInput)).rejects.toThrow(ValidationError)
    })
  })

  describe('update', () => {
    const updateInput = {
      status: 'SOLD',
      notes: 'Sold to local breeder',
    }

    it('should update a hatchling if user owns the clutch', async () => {
      mockHatchlingRepo.findById.mockResolvedValue(mockHatchling)
      mockHatchlingRepo.update.mockResolvedValue({ ...mockHatchling, ...updateInput })

      const result = await service.update(userId, hatchlingId, updateInput)

      expect(result.status).toBe('SOLD')
      expect(result.notes).toBe('Sold to local breeder')
    })

    it('should throw NotFoundError if hatchling does not exist', async () => {
      mockHatchlingRepo.findById.mockResolvedValue(null)

      await expect(service.update(userId, hatchlingId, updateInput)).rejects.toThrow(NotFoundError)
    })

    it('should throw ForbiddenError if user does not own the clutch', async () => {
      mockHatchlingRepo.findById.mockResolvedValue({
        ...mockHatchling,
        clutch: {
          ...mockClutch,
          pairing: { ...mockPairing, userId: 'other-user' },
        },
      })

      await expect(service.update(userId, hatchlingId, updateInput)).rejects.toThrow(ForbiddenError)
    })
  })

  describe('delete', () => {
    it('should delete a hatchling if user owns the clutch', async () => {
      mockHatchlingRepo.findById.mockResolvedValue(mockHatchling)
      mockHatchlingRepo.delete.mockResolvedValue(mockHatchling)

      const result = await service.delete(userId, hatchlingId)

      expect(result.id).toBe(hatchlingId)
      expect(mockHatchlingRepo.delete).toHaveBeenCalledWith(hatchlingId)
    })

    it('should throw NotFoundError if hatchling does not exist', async () => {
      mockHatchlingRepo.findById.mockResolvedValue(null)

      await expect(service.delete(userId, hatchlingId)).rejects.toThrow(NotFoundError)
    })

    it('should throw ForbiddenError if user does not own the clutch', async () => {
      mockHatchlingRepo.findById.mockResolvedValue({
        ...mockHatchling,
        clutch: {
          ...mockClutch,
          pairing: { ...mockPairing, userId: 'other-user' },
        },
      })

      await expect(service.delete(userId, hatchlingId)).rejects.toThrow(ForbiddenError)
    })
  })
})
