// Weight Repository Tests
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { WeightRepository } from './weight.repository'
import { prisma } from '@/lib/db/client'
import type { Weight } from '@/generated/prisma/client'
import { Prisma } from '@/generated/prisma/client'

// Mock the prisma client
vi.mock('@/lib/db/client', () => ({
  prisma: {
    weight: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
  },
}))

// Mock weight for testing
const mockWeight: Weight = {
  id: 'clweight123456789',
  reptileId: 'clreptile123456',
  date: new Date('2024-01-15'),
  weight: new Prisma.Decimal(1250.5),
  notes: 'Post-feeding weight',
  createdAt: new Date('2024-01-15'),
  updatedAt: new Date('2024-01-15'),
}

const mockWeight2: Weight = {
  ...mockWeight,
  id: 'clweight123456790',
  date: new Date('2024-01-01'),
  weight: new Prisma.Decimal(1200.0),
}

describe('WeightRepository', () => {
  let repository: WeightRepository

  beforeEach(() => {
    vi.clearAllMocks()
    repository = new WeightRepository()
  })

  describe('findMany', () => {
    it('should return weights for a reptile with default options', async () => {
      vi.mocked(prisma.weight.findMany).mockResolvedValue([mockWeight, mockWeight2])

      const result = await repository.findMany({ reptileId: 'clreptile123456' })

      expect(result).toEqual([mockWeight, mockWeight2])
      expect(prisma.weight.findMany).toHaveBeenCalledWith({
        where: {
          reptileId: 'clreptile123456',
        },
        skip: 0,
        take: 20,
        orderBy: { date: 'desc' },
      })
    })

    it('should apply pagination options', async () => {
      vi.mocked(prisma.weight.findMany).mockResolvedValue([mockWeight])

      await repository.findMany({ reptileId: 'clreptile123456', skip: 10, take: 5 })

      expect(prisma.weight.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10,
          take: 5,
        })
      )
    })

    it('should apply custom orderBy', async () => {
      vi.mocked(prisma.weight.findMany).mockResolvedValue([mockWeight2, mockWeight])

      await repository.findMany({
        reptileId: 'clreptile123456',
        orderBy: { date: 'asc' },
      })

      expect(prisma.weight.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { date: 'asc' },
        })
      )
    })

    it('should order by weight descending', async () => {
      vi.mocked(prisma.weight.findMany).mockResolvedValue([mockWeight])

      await repository.findMany({
        reptileId: 'clreptile123456',
        orderBy: { weight: 'desc' },
      })

      expect(prisma.weight.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { weight: 'desc' },
        })
      )
    })

    it('should filter by startDate only', async () => {
      vi.mocked(prisma.weight.findMany).mockResolvedValue([mockWeight])
      const startDate = new Date('2024-01-10')

      await repository.findMany({ reptileId: 'clreptile123456', startDate })

      expect(prisma.weight.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            date: { gte: startDate },
          }),
        })
      )
    })

    it('should filter by endDate only', async () => {
      vi.mocked(prisma.weight.findMany).mockResolvedValue([mockWeight])
      const endDate = new Date('2024-01-31')

      await repository.findMany({ reptileId: 'clreptile123456', endDate })

      expect(prisma.weight.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            date: { lte: endDate },
          }),
        })
      )
    })

    it('should filter by date range (both dates)', async () => {
      vi.mocked(prisma.weight.findMany).mockResolvedValue([mockWeight])
      const startDate = new Date('2024-01-01')
      const endDate = new Date('2024-01-31')

      await repository.findMany({ reptileId: 'clreptile123456', startDate, endDate })

      expect(prisma.weight.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            date: { gte: startDate, lte: endDate },
          }),
        })
      )
    })

    it('should not add date filter when neither startDate nor endDate provided', async () => {
      vi.mocked(prisma.weight.findMany).mockResolvedValue([mockWeight])

      await repository.findMany({ reptileId: 'clreptile123456' })

      expect(prisma.weight.findMany).toHaveBeenCalledWith({
        where: {
          reptileId: 'clreptile123456',
        },
        skip: 0,
        take: 20,
        orderBy: { date: 'desc' },
      })
    })
  })

  describe('count', () => {
    it('should return count for a reptile', async () => {
      vi.mocked(prisma.weight.count).mockResolvedValue(25)

      const result = await repository.count({ reptileId: 'clreptile123456' })

      expect(result).toBe(25)
      expect(prisma.weight.count).toHaveBeenCalledWith({
        where: {
          reptileId: 'clreptile123456',
        },
      })
    })

    it('should count with date range filter', async () => {
      vi.mocked(prisma.weight.count).mockResolvedValue(10)
      const startDate = new Date('2024-01-01')
      const endDate = new Date('2024-01-31')

      await repository.count({ reptileId: 'clreptile123456', startDate, endDate })

      expect(prisma.weight.count).toHaveBeenCalledWith({
        where: expect.objectContaining({
          date: { gte: startDate, lte: endDate },
        }),
      })
    })

    it('should count with startDate only', async () => {
      vi.mocked(prisma.weight.count).mockResolvedValue(15)
      const startDate = new Date('2024-01-01')

      await repository.count({ reptileId: 'clreptile123456', startDate })

      expect(prisma.weight.count).toHaveBeenCalledWith({
        where: expect.objectContaining({
          date: { gte: startDate },
        }),
      })
    })
  })

  describe('findById', () => {
    it('should return weight by id', async () => {
      vi.mocked(prisma.weight.findUnique).mockResolvedValue(mockWeight)

      const result = await repository.findById('clweight123456789')

      expect(result).toEqual(mockWeight)
      expect(prisma.weight.findUnique).toHaveBeenCalledWith({
        where: { id: 'clweight123456789' },
      })
    })

    it('should return null when weight not found', async () => {
      vi.mocked(prisma.weight.findUnique).mockResolvedValue(null)

      const result = await repository.findById('nonexistent')

      expect(result).toBeNull()
    })
  })

  describe('create', () => {
    it('should create a new weight record', async () => {
      const createData = {
        reptileId: 'clreptile123456',
        date: new Date('2024-01-20'),
        weight: 1275.5,
      }
      const createdWeight: Weight = {
        ...mockWeight,
        ...createData,
        weight: new Prisma.Decimal(1275.5),
      }
      vi.mocked(prisma.weight.create).mockResolvedValue(createdWeight)

      const result = await repository.create(createData)

      expect(result.weight.toNumber()).toBe(1275.5)
      expect(prisma.weight.create).toHaveBeenCalledWith({
        data: createData,
      })
    })

    it('should create weight with notes', async () => {
      const createData = {
        reptileId: 'clreptile123456',
        date: new Date('2024-01-20'),
        weight: 1300.0,
        notes: 'Weight after big meal',
      }
      const createdWeight: Weight = {
        ...mockWeight,
        ...createData,
        weight: new Prisma.Decimal(1300.0),
      }
      vi.mocked(prisma.weight.create).mockResolvedValue(createdWeight)

      await repository.create(createData)

      expect(prisma.weight.create).toHaveBeenCalledWith({
        data: createData,
      })
    })

    it('should create weight with client-provided id', async () => {
      const createData = {
        id: 'custom-weight-id',
        reptileId: 'clreptile123456',
        date: new Date('2024-01-20'),
        weight: 1300.0,
      }
      const createdWeight: Weight = {
        ...mockWeight,
        ...createData,
        weight: new Prisma.Decimal(1300.0),
      }
      vi.mocked(prisma.weight.create).mockResolvedValue(createdWeight)

      await repository.create(createData)

      expect(prisma.weight.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          id: 'custom-weight-id',
        }),
      })
    })

    it('should handle decimal weight values', async () => {
      const createData = {
        reptileId: 'clreptile123456',
        date: new Date('2024-01-20'),
        weight: 85.75,
      }
      const createdWeight: Weight = {
        ...mockWeight,
        ...createData,
        weight: new Prisma.Decimal(85.75),
      }
      vi.mocked(prisma.weight.create).mockResolvedValue(createdWeight)

      const result = await repository.create(createData)

      expect(result.weight.toNumber()).toBe(85.75)
    })
  })

  describe('update', () => {
    it('should update a weight record', async () => {
      const updatedWeight: Weight = { ...mockWeight, weight: new Prisma.Decimal(1280.0) }
      vi.mocked(prisma.weight.update).mockResolvedValue(updatedWeight)

      const result = await repository.update('clweight123456789', { weight: 1280.0 })

      expect(result.weight.toNumber()).toBe(1280.0)
      expect(prisma.weight.update).toHaveBeenCalledWith({
        where: { id: 'clweight123456789' },
        data: { weight: 1280.0 },
      })
    })

    it('should update notes', async () => {
      vi.mocked(prisma.weight.update).mockResolvedValue({ ...mockWeight, notes: 'Corrected weight' })

      await repository.update('clweight123456789', { notes: 'Corrected weight' })

      expect(prisma.weight.update).toHaveBeenCalledWith({
        where: { id: 'clweight123456789' },
        data: { notes: 'Corrected weight' },
      })
    })

    it('should update date', async () => {
      const newDate = new Date('2024-01-16')
      vi.mocked(prisma.weight.update).mockResolvedValue({ ...mockWeight, date: newDate })

      await repository.update('clweight123456789', { date: newDate })

      expect(prisma.weight.update).toHaveBeenCalledWith({
        where: { id: 'clweight123456789' },
        data: { date: newDate },
      })
    })

    it('should clear notes by setting to null', async () => {
      vi.mocked(prisma.weight.update).mockResolvedValue({ ...mockWeight, notes: null })

      await repository.update('clweight123456789', { notes: null })

      expect(prisma.weight.update).toHaveBeenCalledWith({
        where: { id: 'clweight123456789' },
        data: { notes: null },
      })
    })
  })

  describe('delete', () => {
    it('should delete a weight record', async () => {
      vi.mocked(prisma.weight.delete).mockResolvedValue(mockWeight)

      const result = await repository.delete('clweight123456789')

      expect(result).toEqual(mockWeight)
      expect(prisma.weight.delete).toHaveBeenCalledWith({
        where: { id: 'clweight123456789' },
      })
    })
  })
})
