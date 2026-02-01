// Breeding Repository Tests
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { PairingRepository, ClutchRepository, HatchlingRepository } from './breeding.repository'
import { prisma } from '@/lib/db/client'
import type { Pairing, Clutch, Hatchling, Sex, HatchStatus } from '@/generated/prisma/client'
import { Prisma } from '@/generated/prisma/client'

// Mock the prisma client
vi.mock('@/lib/db/client', () => ({
  prisma: {
    pairing: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    clutch: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    hatchling: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
  },
}))

// Mock pairing for testing
const mockPairing: Pairing = {
  id: 'clpair123456789',
  userId: 'user-123',
  maleId: 'clmale123456789',
  femaleId: 'clfemale123456789',
  startDate: new Date('2024-01-01'),
  endDate: new Date('2024-01-15'),
  successful: true,
  notes: 'Multiple locks observed',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-15'),
}

const mockPairing2: Pairing = {
  ...mockPairing,
  id: 'clpair123456790',
  startDate: new Date('2023-01-01'),
  successful: false,
}

// Mock clutch for testing
const mockClutch: Clutch = {
  id: 'clclutch123456789',
  pairingId: 'clpair123456789',
  layDate: new Date('2024-02-15'),
  eggCount: 6,
  fertileCount: 5,
  incubationTemp: new Prisma.Decimal(88.0),
  dueDate: new Date('2024-04-15'),
  notes: 'Good eggs, one slug',
  createdAt: new Date('2024-02-15'),
  updatedAt: new Date('2024-02-15'),
}

const mockClutch2: Clutch = {
  ...mockClutch,
  id: 'clclutch123456790',
  layDate: new Date('2023-02-15'),
  eggCount: 4,
}

// Mock hatchling for testing
const mockHatchling: Hatchling = {
  id: 'clhatch123456789',
  clutchId: 'clclutch123456789',
  hatchDate: new Date('2024-04-14'),
  status: 'HATCHED' as HatchStatus,
  morph: 'Banana Pied',
  sex: 'FEMALE' as Sex,
  notes: 'Strong hatchling',
  reptileId: null,
  createdAt: new Date('2024-04-14'),
}

const mockHatchling2: Hatchling = {
  ...mockHatchling,
  id: 'clhatch123456790',
  status: 'FAILED' as HatchStatus,
  sex: 'MALE' as Sex,
  notes: 'Did not pip',
}

// =============================================================================
// PAIRING REPOSITORY TESTS
// =============================================================================

describe('PairingRepository', () => {
  let repository: PairingRepository

  beforeEach(() => {
    vi.clearAllMocks()
    repository = new PairingRepository()
  })

  describe('findMany', () => {
    it('should return pairings for a user with default options', async () => {
      vi.mocked(prisma.pairing.findMany).mockResolvedValue([mockPairing])

      const result = await repository.findMany({ userId: 'user-123' })

      expect(result).toEqual([mockPairing])
      expect(prisma.pairing.findMany).toHaveBeenCalledWith({
        where: {
          userId: 'user-123',
        },
        skip: 0,
        take: 20,
        orderBy: { startDate: 'desc' },
        include: {
          male: {
            select: { id: true, name: true, species: true, morph: true },
          },
          female: {
            select: { id: true, name: true, species: true, morph: true },
          },
        },
      })
    })

    it('should apply pagination options', async () => {
      vi.mocked(prisma.pairing.findMany).mockResolvedValue([mockPairing])

      await repository.findMany({ userId: 'user-123', skip: 10, take: 5 })

      expect(prisma.pairing.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10,
          take: 5,
        })
      )
    })

    it('should apply custom orderBy', async () => {
      vi.mocked(prisma.pairing.findMany).mockResolvedValue([mockPairing])

      await repository.findMany({
        userId: 'user-123',
        orderBy: { endDate: 'asc' },
      })

      expect(prisma.pairing.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { endDate: 'asc' },
        })
      )
    })

    it('should filter by date range (both dates)', async () => {
      vi.mocked(prisma.pairing.findMany).mockResolvedValue([mockPairing])
      const startDate = new Date('2024-01-01')
      const endDate = new Date('2024-01-31')

      await repository.findMany({ userId: 'user-123', startDate, endDate })

      expect(prisma.pairing.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            startDate: { gte: startDate, lte: endDate },
          }),
        })
      )
    })

    it('should filter by startDate only', async () => {
      vi.mocked(prisma.pairing.findMany).mockResolvedValue([mockPairing])
      const startDate = new Date('2024-01-01')

      await repository.findMany({ userId: 'user-123', startDate })

      expect(prisma.pairing.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            startDate: { gte: startDate },
          }),
        })
      )
    })

    it('should filter by endDate only', async () => {
      vi.mocked(prisma.pairing.findMany).mockResolvedValue([mockPairing])
      const endDate = new Date('2024-01-31')

      await repository.findMany({ userId: 'user-123', endDate })

      expect(prisma.pairing.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            startDate: { lte: endDate },
          }),
        })
      )
    })

    it('should filter by successful status (true)', async () => {
      vi.mocked(prisma.pairing.findMany).mockResolvedValue([mockPairing])

      await repository.findMany({ userId: 'user-123', successful: true })

      expect(prisma.pairing.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            successful: true,
          }),
        })
      )
    })

    it('should filter by successful status (false)', async () => {
      vi.mocked(prisma.pairing.findMany).mockResolvedValue([mockPairing2])

      await repository.findMany({ userId: 'user-123', successful: false })

      expect(prisma.pairing.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            successful: false,
          }),
        })
      )
    })
  })

  describe('count', () => {
    it('should return count for a user', async () => {
      vi.mocked(prisma.pairing.count).mockResolvedValue(10)

      const result = await repository.count({ userId: 'user-123' })

      expect(result).toBe(10)
      expect(prisma.pairing.count).toHaveBeenCalledWith({
        where: {
          userId: 'user-123',
        },
      })
    })

    it('should count with successful filter', async () => {
      vi.mocked(prisma.pairing.count).mockResolvedValue(7)

      await repository.count({ userId: 'user-123', successful: true })

      expect(prisma.pairing.count).toHaveBeenCalledWith({
        where: expect.objectContaining({
          successful: true,
        }),
      })
    })
  })

  describe('findById', () => {
    it('should return pairing by id', async () => {
      vi.mocked(prisma.pairing.findUnique).mockResolvedValue(mockPairing)

      const result = await repository.findById('clpair123456789')

      expect(result).toEqual(mockPairing)
      expect(prisma.pairing.findUnique).toHaveBeenCalledWith({
        where: { id: 'clpair123456789' },
        include: undefined,
      })
    })

    it('should return null when pairing not found', async () => {
      vi.mocked(prisma.pairing.findUnique).mockResolvedValue(null)

      const result = await repository.findById('nonexistent')

      expect(result).toBeNull()
    })

    it('should include male when requested', async () => {
      const pairingWithMale = {
        ...mockPairing,
        male: { id: 'clmale123456789', userId: 'user-123', deletedAt: null, name: 'Apollo', species: 'ball_python' },
      }
      vi.mocked(prisma.pairing.findUnique).mockResolvedValue(pairingWithMale)

      await repository.findById('clpair123456789', { includeMale: true })

      expect(prisma.pairing.findUnique).toHaveBeenCalledWith({
        where: { id: 'clpair123456789' },
        include: {
          male: {
            select: {
              id: true,
              userId: true,
              deletedAt: true,
              name: true,
              species: true,
            },
          },
        },
      })
    })

    it('should include female when requested', async () => {
      vi.mocked(prisma.pairing.findUnique).mockResolvedValue(mockPairing)

      await repository.findById('clpair123456789', { includeFemale: true })

      expect(prisma.pairing.findUnique).toHaveBeenCalledWith({
        where: { id: 'clpair123456789' },
        include: {
          female: {
            select: {
              id: true,
              userId: true,
              deletedAt: true,
              name: true,
              species: true,
            },
          },
        },
      })
    })

    it('should include clutches when requested', async () => {
      vi.mocked(prisma.pairing.findUnique).mockResolvedValue({ ...mockPairing, clutches: [mockClutch] } as Pairing & { clutches: Clutch[] })

      await repository.findById('clpair123456789', { includeClutches: true })

      expect(prisma.pairing.findUnique).toHaveBeenCalledWith({
        where: { id: 'clpair123456789' },
        include: {
          clutches: true,
        },
      })
    })

    it('should include multiple relations', async () => {
      vi.mocked(prisma.pairing.findUnique).mockResolvedValue(mockPairing)

      await repository.findById('clpair123456789', {
        includeMale: true,
        includeFemale: true,
        includeClutches: true,
      })

      expect(prisma.pairing.findUnique).toHaveBeenCalledWith({
        where: { id: 'clpair123456789' },
        include: expect.objectContaining({
          male: expect.any(Object),
          female: expect.any(Object),
          clutches: true,
        }),
      })
    })
  })

  describe('create', () => {
    it('should create a new pairing with required fields', async () => {
      const createData = {
        userId: 'user-123',
        maleId: 'clmale123456789',
        femaleId: 'clfemale123456789',
        startDate: new Date('2024-02-01'),
      }
      vi.mocked(prisma.pairing.create).mockResolvedValue({ ...mockPairing, ...createData })

      const result = await repository.create(createData)

      expect(result.maleId).toBe('clmale123456789')
      expect(prisma.pairing.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-123',
          maleId: 'clmale123456789',
          femaleId: 'clfemale123456789',
          startDate: createData.startDate,
          endDate: null,
          successful: null,
          notes: null,
        },
      })
    })

    it('should create pairing with all optional fields', async () => {
      const createData = {
        userId: 'user-123',
        maleId: 'clmale123456789',
        femaleId: 'clfemale123456789',
        startDate: new Date('2024-02-01'),
        endDate: new Date('2024-02-15'),
        successful: true,
        notes: 'Successful pairing',
      }
      vi.mocked(prisma.pairing.create).mockResolvedValue({ ...mockPairing, ...createData })

      await repository.create(createData)

      expect(prisma.pairing.create).toHaveBeenCalledWith({
        data: createData,
      })
    })

    it('should create pairing with client-provided id', async () => {
      const createData = {
        id: 'custom-pair-id',
        userId: 'user-123',
        maleId: 'clmale123456789',
        femaleId: 'clfemale123456789',
        startDate: new Date('2024-02-01'),
      }
      vi.mocked(prisma.pairing.create).mockResolvedValue({ ...mockPairing, ...createData })

      await repository.create(createData)

      expect(prisma.pairing.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          id: 'custom-pair-id',
        }),
      })
    })
  })

  describe('update', () => {
    it('should update a pairing', async () => {
      const updatedPairing = { ...mockPairing, successful: true }
      vi.mocked(prisma.pairing.update).mockResolvedValue(updatedPairing)

      const result = await repository.update('clpair123456789', { successful: true })

      expect(result.successful).toBe(true)
      expect(prisma.pairing.update).toHaveBeenCalledWith({
        where: { id: 'clpair123456789' },
        data: { successful: true },
      })
    })

    it('should set end date', async () => {
      const endDate = new Date('2024-02-20')
      vi.mocked(prisma.pairing.update).mockResolvedValue({ ...mockPairing, endDate })

      await repository.update('clpair123456789', { endDate })

      expect(prisma.pairing.update).toHaveBeenCalledWith({
        where: { id: 'clpair123456789' },
        data: { endDate },
      })
    })
  })

  describe('delete', () => {
    it('should delete a pairing', async () => {
      vi.mocked(prisma.pairing.delete).mockResolvedValue(mockPairing)

      const result = await repository.delete('clpair123456789')

      expect(result).toEqual(mockPairing)
      expect(prisma.pairing.delete).toHaveBeenCalledWith({
        where: { id: 'clpair123456789' },
      })
    })
  })
})

// =============================================================================
// CLUTCH REPOSITORY TESTS
// =============================================================================

describe('ClutchRepository', () => {
  let repository: ClutchRepository

  beforeEach(() => {
    vi.clearAllMocks()
    repository = new ClutchRepository()
  })

  describe('findMany', () => {
    it('should return clutches for a pairing with default options', async () => {
      vi.mocked(prisma.clutch.findMany).mockResolvedValue([mockClutch])

      const result = await repository.findMany({ pairingId: 'clpair123456789' })

      expect(result).toEqual([mockClutch])
      expect(prisma.clutch.findMany).toHaveBeenCalledWith({
        where: {
          pairingId: 'clpair123456789',
        },
        skip: 0,
        take: 20,
        orderBy: { layDate: 'desc' },
      })
    })

    it('should apply pagination options', async () => {
      vi.mocked(prisma.clutch.findMany).mockResolvedValue([mockClutch])

      await repository.findMany({ pairingId: 'clpair123456789', skip: 5, take: 10 })

      expect(prisma.clutch.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 5,
          take: 10,
        })
      )
    })

    it('should apply custom orderBy', async () => {
      vi.mocked(prisma.clutch.findMany).mockResolvedValue([mockClutch])

      await repository.findMany({
        pairingId: 'clpair123456789',
        orderBy: { eggCount: 'desc' },
      })

      expect(prisma.clutch.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { eggCount: 'desc' },
        })
      )
    })
  })

  describe('count', () => {
    it('should return count for a pairing', async () => {
      vi.mocked(prisma.clutch.count).mockResolvedValue(3)

      const result = await repository.count({ pairingId: 'clpair123456789' })

      expect(result).toBe(3)
      expect(prisma.clutch.count).toHaveBeenCalledWith({
        where: {
          pairingId: 'clpair123456789',
        },
      })
    })
  })

  describe('findById', () => {
    it('should return clutch by id', async () => {
      vi.mocked(prisma.clutch.findUnique).mockResolvedValue(mockClutch)

      const result = await repository.findById('clclutch123456789')

      expect(result).toEqual(mockClutch)
      expect(prisma.clutch.findUnique).toHaveBeenCalledWith({
        where: { id: 'clclutch123456789' },
        include: undefined,
      })
    })

    it('should return null when clutch not found', async () => {
      vi.mocked(prisma.clutch.findUnique).mockResolvedValue(null)

      const result = await repository.findById('nonexistent')

      expect(result).toBeNull()
    })

    it('should include pairing when requested', async () => {
      vi.mocked(prisma.clutch.findUnique).mockResolvedValue({ ...mockClutch, pairing: mockPairing } as Clutch & { pairing: Pairing })

      await repository.findById('clclutch123456789', { includePairing: true })

      expect(prisma.clutch.findUnique).toHaveBeenCalledWith({
        where: { id: 'clclutch123456789' },
        include: {
          pairing: true,
        },
      })
    })

    it('should include hatchlings when requested', async () => {
      vi.mocked(prisma.clutch.findUnique).mockResolvedValue({ ...mockClutch, hatchlings: [mockHatchling] } as Clutch & { hatchlings: Hatchling[] })

      await repository.findById('clclutch123456789', { includeHatchlings: true })

      expect(prisma.clutch.findUnique).toHaveBeenCalledWith({
        where: { id: 'clclutch123456789' },
        include: {
          hatchlings: true,
        },
      })
    })
  })

  describe('create', () => {
    it('should create a new clutch with required fields', async () => {
      const createData = {
        pairingId: 'clpair123456789',
        layDate: new Date('2024-03-01'),
        eggCount: 5,
      }
      vi.mocked(prisma.clutch.create).mockResolvedValue({ ...mockClutch, ...createData })

      const result = await repository.create(createData)

      expect(result.eggCount).toBe(5)
      expect(prisma.clutch.create).toHaveBeenCalledWith({
        data: {
          pairingId: 'clpair123456789',
          layDate: createData.layDate,
          eggCount: 5,
          fertileCount: null,
          incubationTemp: null,
          dueDate: null,
          notes: null,
        },
      })
    })

    it('should create clutch with all optional fields', async () => {
      const createData = {
        pairingId: 'clpair123456789',
        layDate: new Date('2024-03-01'),
        eggCount: 8,
        fertileCount: 7,
        incubationTemp: 89.0,
        dueDate: new Date('2024-05-01'),
        notes: 'Large clutch',
      }
      vi.mocked(prisma.clutch.create).mockResolvedValue({
        ...mockClutch,
        ...createData,
        incubationTemp: new Prisma.Decimal(89.0),
      })

      await repository.create(createData)

      expect(prisma.clutch.create).toHaveBeenCalledWith({
        data: createData,
      })
    })

    it('should create clutch with client-provided id', async () => {
      const createData = {
        id: 'custom-clutch-id',
        pairingId: 'clpair123456789',
        layDate: new Date('2024-03-01'),
        eggCount: 5,
      }
      vi.mocked(prisma.clutch.create).mockResolvedValue({ ...mockClutch, ...createData })

      await repository.create(createData)

      expect(prisma.clutch.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          id: 'custom-clutch-id',
        }),
      })
    })
  })

  describe('update', () => {
    it('should update a clutch', async () => {
      const updatedClutch = { ...mockClutch, fertileCount: 6 }
      vi.mocked(prisma.clutch.update).mockResolvedValue(updatedClutch)

      const result = await repository.update('clclutch123456789', { fertileCount: 6 })

      expect(result.fertileCount).toBe(6)
      expect(prisma.clutch.update).toHaveBeenCalledWith({
        where: { id: 'clclutch123456789' },
        data: { fertileCount: 6 },
      })
    })

    it('should update incubation temperature', async () => {
      vi.mocked(prisma.clutch.update).mockResolvedValue({ ...mockClutch, incubationTemp: new Prisma.Decimal(87.5) })

      await repository.update('clclutch123456789', { incubationTemp: new Prisma.Decimal(87.5) })

      expect(prisma.clutch.update).toHaveBeenCalledWith({
        where: { id: 'clclutch123456789' },
        data: { incubationTemp: new Prisma.Decimal(87.5) },
      })
    })
  })

  describe('delete', () => {
    it('should delete a clutch', async () => {
      vi.mocked(prisma.clutch.delete).mockResolvedValue(mockClutch)

      const result = await repository.delete('clclutch123456789')

      expect(result).toEqual(mockClutch)
      expect(prisma.clutch.delete).toHaveBeenCalledWith({
        where: { id: 'clclutch123456789' },
      })
    })
  })
})

// =============================================================================
// HATCHLING REPOSITORY TESTS
// =============================================================================

describe('HatchlingRepository', () => {
  let repository: HatchlingRepository

  beforeEach(() => {
    vi.clearAllMocks()
    repository = new HatchlingRepository()
  })

  describe('findMany', () => {
    it('should return hatchlings for a clutch with default options', async () => {
      vi.mocked(prisma.hatchling.findMany).mockResolvedValue([mockHatchling])

      const result = await repository.findMany({ clutchId: 'clclutch123456789' })

      expect(result).toEqual([mockHatchling])
      expect(prisma.hatchling.findMany).toHaveBeenCalledWith({
        where: {
          clutchId: 'clclutch123456789',
        },
        skip: 0,
        take: 20,
        orderBy: { createdAt: 'desc' },
      })
    })

    it('should apply pagination options', async () => {
      vi.mocked(prisma.hatchling.findMany).mockResolvedValue([mockHatchling])

      await repository.findMany({ clutchId: 'clclutch123456789', skip: 5, take: 10 })

      expect(prisma.hatchling.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 5,
          take: 10,
        })
      )
    })

    it('should filter by status', async () => {
      vi.mocked(prisma.hatchling.findMany).mockResolvedValue([mockHatchling])

      await repository.findMany({ clutchId: 'clclutch123456789', status: 'HATCHED' })

      expect(prisma.hatchling.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'HATCHED',
          }),
        })
      )
    })

    it('should filter by failed status', async () => {
      vi.mocked(prisma.hatchling.findMany).mockResolvedValue([mockHatchling2])

      await repository.findMany({ clutchId: 'clclutch123456789', status: 'FAILED' })

      expect(prisma.hatchling.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'FAILED',
          }),
        })
      )
    })
  })

  describe('count', () => {
    it('should return count for a clutch', async () => {
      vi.mocked(prisma.hatchling.count).mockResolvedValue(5)

      const result = await repository.count({ clutchId: 'clclutch123456789' })

      expect(result).toBe(5)
      expect(prisma.hatchling.count).toHaveBeenCalledWith({
        where: {
          clutchId: 'clclutch123456789',
        },
      })
    })

    it('should count with status filter', async () => {
      vi.mocked(prisma.hatchling.count).mockResolvedValue(4)

      await repository.count({ clutchId: 'clclutch123456789', status: 'HATCHED' })

      expect(prisma.hatchling.count).toHaveBeenCalledWith({
        where: expect.objectContaining({
          status: 'HATCHED',
        }),
      })
    })
  })

  describe('findById', () => {
    it('should return hatchling by id', async () => {
      vi.mocked(prisma.hatchling.findUnique).mockResolvedValue(mockHatchling)

      const result = await repository.findById('clhatch123456789')

      expect(result).toEqual(mockHatchling)
      expect(prisma.hatchling.findUnique).toHaveBeenCalledWith({
        where: { id: 'clhatch123456789' },
        include: undefined,
      })
    })

    it('should return null when hatchling not found', async () => {
      vi.mocked(prisma.hatchling.findUnique).mockResolvedValue(null)

      const result = await repository.findById('nonexistent')

      expect(result).toBeNull()
    })

    it('should include clutch with pairing when requested', async () => {
      const hatchlingWithClutch = {
        ...mockHatchling,
        clutch: { ...mockClutch, pairing: mockPairing },
      }
      vi.mocked(prisma.hatchling.findUnique).mockResolvedValue(hatchlingWithClutch)

      await repository.findById('clhatch123456789', { includeClutch: true })

      expect(prisma.hatchling.findUnique).toHaveBeenCalledWith({
        where: { id: 'clhatch123456789' },
        include: {
          clutch: {
            include: {
              pairing: true,
            },
          },
        },
      })
    })
  })

  describe('create', () => {
    it('should create a new hatchling with required fields', async () => {
      const createData = {
        clutchId: 'clclutch123456789',
        status: 'HATCHED' as HatchStatus,
        sex: 'UNKNOWN' as Sex,
      }
      vi.mocked(prisma.hatchling.create).mockResolvedValue({ ...mockHatchling, ...createData })

      const result = await repository.create(createData)

      expect(result.status).toBe('HATCHED')
      expect(prisma.hatchling.create).toHaveBeenCalledWith({
        data: {
          clutchId: 'clclutch123456789',
          hatchDate: null,
          status: 'HATCHED',
          morph: null,
          sex: 'UNKNOWN',
          notes: null,
          reptileId: null,
        },
      })
    })

    it('should create hatchling with all optional fields', async () => {
      const createData = {
        clutchId: 'clclutch123456789',
        hatchDate: new Date('2024-04-15'),
        status: 'HATCHED' as HatchStatus,
        morph: 'Pastel Pied',
        sex: 'MALE' as Sex,
        notes: 'First to pip',
        reptileId: 'clreptile123456',
      }
      vi.mocked(prisma.hatchling.create).mockResolvedValue({ ...mockHatchling, ...createData })

      await repository.create(createData)

      expect(prisma.hatchling.create).toHaveBeenCalledWith({
        data: createData,
      })
    })

    it('should create hatchling with client-provided id', async () => {
      const createData = {
        id: 'custom-hatch-id',
        clutchId: 'clclutch123456789',
        status: 'HATCHED' as HatchStatus,
        sex: 'FEMALE' as Sex,
      }
      vi.mocked(prisma.hatchling.create).mockResolvedValue({ ...mockHatchling, ...createData })

      await repository.create(createData)

      expect(prisma.hatchling.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          id: 'custom-hatch-id',
        }),
      })
    })
  })

  describe('update', () => {
    it('should update a hatchling', async () => {
      const updatedHatchling = { ...mockHatchling, sex: 'MALE' as Sex }
      vi.mocked(prisma.hatchling.update).mockResolvedValue(updatedHatchling)

      const result = await repository.update('clhatch123456789', { sex: 'MALE' })

      expect(result.sex).toBe('MALE')
      expect(prisma.hatchling.update).toHaveBeenCalledWith({
        where: { id: 'clhatch123456789' },
        data: { sex: 'MALE' },
      })
    })

    it('should link to reptile', async () => {
      vi.mocked(prisma.hatchling.update).mockResolvedValue({ ...mockHatchling, reptileId: 'clreptile123456' })

      await repository.update('clhatch123456789', { reptileId: 'clreptile123456' })

      expect(prisma.hatchling.update).toHaveBeenCalledWith({
        where: { id: 'clhatch123456789' },
        data: { reptileId: 'clreptile123456' },
      })
    })

    it('should update status to sold', async () => {
      vi.mocked(prisma.hatchling.update).mockResolvedValue({ ...mockHatchling, status: 'SOLD' as HatchStatus })

      await repository.update('clhatch123456789', { status: 'SOLD' })

      expect(prisma.hatchling.update).toHaveBeenCalledWith({
        where: { id: 'clhatch123456789' },
        data: { status: 'SOLD' },
      })
    })
  })

  describe('delete', () => {
    it('should delete a hatchling', async () => {
      vi.mocked(prisma.hatchling.delete).mockResolvedValue(mockHatchling)

      const result = await repository.delete('clhatch123456789')

      expect(result).toEqual(mockHatchling)
      expect(prisma.hatchling.delete).toHaveBeenCalledWith({
        where: { id: 'clhatch123456789' },
      })
    })
  })
})
