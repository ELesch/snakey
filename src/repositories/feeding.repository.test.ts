// Feeding Repository Tests
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { FeedingRepository } from './feeding.repository'
import { prisma } from '@/lib/db/client'
import type { Feeding, PreySource } from '@/generated/prisma/client'

// Mock the prisma client
vi.mock('@/lib/db/client', () => ({
  prisma: {
    feeding: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
  },
}))

// Mock feeding for testing
const mockFeeding: Feeding = {
  id: 'clfeed123456789',
  reptileId: 'clreptile123456',
  date: new Date('2024-01-15'),
  preyType: 'mouse',
  preySize: 'medium',
  preySource: 'FROZEN_THAWED' as PreySource,
  accepted: true,
  refused: false,
  regurgitated: false,
  notes: 'Fed well',
  createdAt: new Date('2024-01-15'),
  updatedAt: new Date('2024-01-15'),
}

const mockFeeding2: Feeding = {
  ...mockFeeding,
  id: 'clfeed123456790',
  date: new Date('2024-01-08'),
  accepted: false,
  refused: true,
}

describe('FeedingRepository', () => {
  let repository: FeedingRepository

  beforeEach(() => {
    vi.clearAllMocks()
    repository = new FeedingRepository()
  })

  describe('findMany', () => {
    it('should return feedings for a reptile with default options', async () => {
      vi.mocked(prisma.feeding.findMany).mockResolvedValue([mockFeeding])

      const result = await repository.findMany({ reptileId: 'clreptile123456' })

      expect(result).toEqual([mockFeeding])
      expect(prisma.feeding.findMany).toHaveBeenCalledWith({
        where: {
          reptileId: 'clreptile123456',
        },
        skip: 0,
        take: 20,
        orderBy: { date: 'desc' },
      })
    })

    it('should apply pagination options', async () => {
      vi.mocked(prisma.feeding.findMany).mockResolvedValue([mockFeeding])

      await repository.findMany({ reptileId: 'clreptile123456', skip: 10, take: 5 })

      expect(prisma.feeding.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10,
          take: 5,
        })
      )
    })

    it('should apply custom orderBy', async () => {
      vi.mocked(prisma.feeding.findMany).mockResolvedValue([mockFeeding])

      await repository.findMany({
        reptileId: 'clreptile123456',
        orderBy: { preyType: 'asc' },
      })

      expect(prisma.feeding.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { preyType: 'asc' },
        })
      )
    })

    it('should filter by date range (both dates)', async () => {
      vi.mocked(prisma.feeding.findMany).mockResolvedValue([mockFeeding])
      const startDate = new Date('2024-01-01')
      const endDate = new Date('2024-01-31')

      await repository.findMany({ reptileId: 'clreptile123456', startDate, endDate })

      expect(prisma.feeding.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            date: {
              gte: startDate,
              lte: endDate,
            },
          }),
        })
      )
    })

    it('should filter by startDate only', async () => {
      vi.mocked(prisma.feeding.findMany).mockResolvedValue([mockFeeding])
      const startDate = new Date('2024-01-01')

      await repository.findMany({ reptileId: 'clreptile123456', startDate })

      expect(prisma.feeding.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            date: { gte: startDate },
          }),
        })
      )
    })

    it('should filter by endDate only', async () => {
      vi.mocked(prisma.feeding.findMany).mockResolvedValue([mockFeeding])
      const endDate = new Date('2024-01-31')

      await repository.findMany({ reptileId: 'clreptile123456', endDate })

      expect(prisma.feeding.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            date: { lte: endDate },
          }),
        })
      )
    })

    it('should filter by preyType', async () => {
      vi.mocked(prisma.feeding.findMany).mockResolvedValue([mockFeeding])

      await repository.findMany({ reptileId: 'clreptile123456', preyType: 'mouse' })

      expect(prisma.feeding.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            preyType: 'mouse',
          }),
        })
      )
    })

    it('should filter by accepted status (true)', async () => {
      vi.mocked(prisma.feeding.findMany).mockResolvedValue([mockFeeding])

      await repository.findMany({ reptileId: 'clreptile123456', accepted: true })

      expect(prisma.feeding.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            accepted: true,
          }),
        })
      )
    })

    it('should filter by accepted status (false)', async () => {
      vi.mocked(prisma.feeding.findMany).mockResolvedValue([mockFeeding2])

      await repository.findMany({ reptileId: 'clreptile123456', accepted: false })

      expect(prisma.feeding.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            accepted: false,
          }),
        })
      )
    })

    it('should combine multiple filters', async () => {
      vi.mocked(prisma.feeding.findMany).mockResolvedValue([mockFeeding])
      const startDate = new Date('2024-01-01')
      const endDate = new Date('2024-01-31')

      await repository.findMany({
        reptileId: 'clreptile123456',
        startDate,
        endDate,
        preyType: 'mouse',
        accepted: true,
      })

      expect(prisma.feeding.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            reptileId: 'clreptile123456',
            date: { gte: startDate, lte: endDate },
            preyType: 'mouse',
            accepted: true,
          },
        })
      )
    })
  })

  describe('count', () => {
    it('should return count for a reptile', async () => {
      vi.mocked(prisma.feeding.count).mockResolvedValue(10)

      const result = await repository.count({ reptileId: 'clreptile123456' })

      expect(result).toBe(10)
      expect(prisma.feeding.count).toHaveBeenCalledWith({
        where: {
          reptileId: 'clreptile123456',
        },
      })
    })

    it('should count with date range filter', async () => {
      vi.mocked(prisma.feeding.count).mockResolvedValue(5)
      const startDate = new Date('2024-01-01')
      const endDate = new Date('2024-01-31')

      await repository.count({ reptileId: 'clreptile123456', startDate, endDate })

      expect(prisma.feeding.count).toHaveBeenCalledWith({
        where: expect.objectContaining({
          date: { gte: startDate, lte: endDate },
        }),
      })
    })

    it('should count with preyType filter', async () => {
      vi.mocked(prisma.feeding.count).mockResolvedValue(3)

      await repository.count({ reptileId: 'clreptile123456', preyType: 'mouse' })

      expect(prisma.feeding.count).toHaveBeenCalledWith({
        where: expect.objectContaining({
          preyType: 'mouse',
        }),
      })
    })
  })

  describe('findById', () => {
    it('should return feeding by id', async () => {
      vi.mocked(prisma.feeding.findUnique).mockResolvedValue(mockFeeding)

      const result = await repository.findById('clfeed123456789')

      expect(result).toEqual(mockFeeding)
      expect(prisma.feeding.findUnique).toHaveBeenCalledWith({
        where: { id: 'clfeed123456789' },
        include: undefined,
      })
    })

    it('should return null when feeding not found', async () => {
      vi.mocked(prisma.feeding.findUnique).mockResolvedValue(null)

      const result = await repository.findById('nonexistent')

      expect(result).toBeNull()
    })

    it('should include reptile when requested', async () => {
      const feedingWithReptile = {
        ...mockFeeding,
        reptile: { id: 'clreptile123456', userId: 'user-123', deletedAt: null },
      }
      vi.mocked(prisma.feeding.findUnique).mockResolvedValue(feedingWithReptile)

      await repository.findById('clfeed123456789', { includeReptile: true })

      expect(prisma.feeding.findUnique).toHaveBeenCalledWith({
        where: { id: 'clfeed123456789' },
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
    it('should create a new feeding with required fields', async () => {
      const createData = {
        reptileId: 'clreptile123456',
        date: new Date('2024-01-20'),
        preyType: 'rat',
        preySize: 'small',
        preySource: 'FROZEN_THAWED' as PreySource,
        accepted: true,
      }
      vi.mocked(prisma.feeding.create).mockResolvedValue({ ...mockFeeding, ...createData })

      const result = await repository.create(createData)

      expect(result.preyType).toBe('rat')
      expect(prisma.feeding.create).toHaveBeenCalledWith({
        data: {
          reptileId: 'clreptile123456',
          date: createData.date,
          preyType: 'rat',
          preySize: 'small',
          preySource: 'FROZEN_THAWED',
          accepted: true,
          refused: false,
          regurgitated: false,
          notes: null,
        },
      })
    })

    it('should create feeding with all optional fields', async () => {
      const createData = {
        reptileId: 'clreptile123456',
        date: new Date('2024-01-20'),
        preyType: 'rat',
        preySize: 'small',
        preySource: 'LIVE' as PreySource,
        accepted: false,
        refused: true,
        regurgitated: false,
        notes: 'Refused to eat',
      }
      vi.mocked(prisma.feeding.create).mockResolvedValue({ ...mockFeeding, ...createData })

      await repository.create(createData)

      expect(prisma.feeding.create).toHaveBeenCalledWith({
        data: {
          reptileId: 'clreptile123456',
          date: createData.date,
          preyType: 'rat',
          preySize: 'small',
          preySource: 'LIVE',
          accepted: false,
          refused: true,
          regurgitated: false,
          notes: 'Refused to eat',
        },
      })
    })

    it('should create feeding with client-provided id', async () => {
      const createData = {
        id: 'custom-feed-id',
        reptileId: 'clreptile123456',
        date: new Date('2024-01-20'),
        preyType: 'mouse',
        preySize: 'medium',
        preySource: 'FROZEN_THAWED' as PreySource,
        accepted: true,
      }
      vi.mocked(prisma.feeding.create).mockResolvedValue({ ...mockFeeding, ...createData })

      await repository.create(createData)

      expect(prisma.feeding.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          id: 'custom-feed-id',
        }),
      })
    })

    it('should handle regurgitated feeding', async () => {
      const createData = {
        reptileId: 'clreptile123456',
        date: new Date('2024-01-20'),
        preyType: 'mouse',
        preySize: 'medium',
        preySource: 'FROZEN_THAWED' as PreySource,
        accepted: true,
        regurgitated: true,
        notes: 'Regurgitated after 2 days',
      }
      vi.mocked(prisma.feeding.create).mockResolvedValue({ ...mockFeeding, ...createData })

      await repository.create(createData)

      expect(prisma.feeding.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          regurgitated: true,
        }),
      })
    })
  })

  describe('update', () => {
    it('should update a feeding', async () => {
      const updatedFeeding = { ...mockFeeding, notes: 'Updated notes' }
      vi.mocked(prisma.feeding.update).mockResolvedValue(updatedFeeding)

      const result = await repository.update('clfeed123456789', { notes: 'Updated notes' })

      expect(result.notes).toBe('Updated notes')
      expect(prisma.feeding.update).toHaveBeenCalledWith({
        where: { id: 'clfeed123456789' },
        data: { notes: 'Updated notes' },
      })
    })

    it('should allow partial updates', async () => {
      vi.mocked(prisma.feeding.update).mockResolvedValue({ ...mockFeeding, accepted: false })

      await repository.update('clfeed123456789', { accepted: false })

      expect(prisma.feeding.update).toHaveBeenCalledWith({
        where: { id: 'clfeed123456789' },
        data: { accepted: false },
      })
    })

    it('should update multiple fields at once', async () => {
      vi.mocked(prisma.feeding.update).mockResolvedValue({
        ...mockFeeding,
        accepted: true,
        regurgitated: true,
        notes: 'Ate but regurgitated later',
      })

      await repository.update('clfeed123456789', {
        accepted: true,
        regurgitated: true,
        notes: 'Ate but regurgitated later',
      })

      expect(prisma.feeding.update).toHaveBeenCalledWith({
        where: { id: 'clfeed123456789' },
        data: {
          accepted: true,
          regurgitated: true,
          notes: 'Ate but regurgitated later',
        },
      })
    })
  })

  describe('delete', () => {
    it('should delete a feeding', async () => {
      vi.mocked(prisma.feeding.delete).mockResolvedValue(mockFeeding)

      const result = await repository.delete('clfeed123456789')

      expect(result).toEqual(mockFeeding)
      expect(prisma.feeding.delete).toHaveBeenCalledWith({
        where: { id: 'clfeed123456789' },
      })
    })
  })
})
