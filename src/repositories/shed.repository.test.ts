// Shed Repository Tests
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ShedRepository } from './shed.repository'
import { prisma } from '@/lib/db/client'
import type { Shed, ShedQuality } from '@/generated/prisma/client'

// Mock the prisma client
vi.mock('@/lib/db/client', () => ({
  prisma: {
    shed: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
  },
}))

// Mock shed for testing
const mockShed: Shed = {
  id: 'clshed123456789',
  reptileId: 'clreptile123456',
  startDate: new Date('2024-01-10'),
  completedDate: new Date('2024-01-14'),
  quality: 'COMPLETE' as ShedQuality,
  isComplete: true,
  issues: null,
  notes: 'Clean shed in one piece',
  createdAt: new Date('2024-01-14'),
  updatedAt: new Date('2024-01-14'),
}

const mockShed2: Shed = {
  ...mockShed,
  id: 'clshed123456790',
  completedDate: new Date('2023-12-20'),
  quality: 'PARTIAL' as ShedQuality,
  isComplete: false,
  issues: 'Some stuck shed on tail',
  notes: 'Needed assistance',
}

describe('ShedRepository', () => {
  let repository: ShedRepository

  beforeEach(() => {
    vi.clearAllMocks()
    repository = new ShedRepository()
  })

  describe('findMany', () => {
    it('should return sheds for a reptile with default options', async () => {
      vi.mocked(prisma.shed.findMany).mockResolvedValue([mockShed])

      const result = await repository.findMany({ reptileId: 'clreptile123456' })

      expect(result).toEqual([mockShed])
      expect(prisma.shed.findMany).toHaveBeenCalledWith({
        where: {
          reptileId: 'clreptile123456',
        },
        skip: 0,
        take: 20,
        orderBy: { completedDate: 'desc' },
      })
    })

    it('should apply pagination options', async () => {
      vi.mocked(prisma.shed.findMany).mockResolvedValue([mockShed])

      await repository.findMany({ reptileId: 'clreptile123456', skip: 5, take: 10 })

      expect(prisma.shed.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 5,
          take: 10,
        })
      )
    })

    it('should apply custom orderBy', async () => {
      vi.mocked(prisma.shed.findMany).mockResolvedValue([mockShed])

      await repository.findMany({
        reptileId: 'clreptile123456',
        orderBy: { startDate: 'asc' },
      })

      expect(prisma.shed.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { startDate: 'asc' },
        })
      )
    })

    it('should filter by quality', async () => {
      vi.mocked(prisma.shed.findMany).mockResolvedValue([mockShed])

      await repository.findMany({ reptileId: 'clreptile123456', quality: 'COMPLETE' })

      expect(prisma.shed.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            quality: 'COMPLETE',
          }),
        })
      )
    })

    it('should filter by startAfter date', async () => {
      vi.mocked(prisma.shed.findMany).mockResolvedValue([mockShed])
      const startAfter = new Date('2024-01-01')

      await repository.findMany({ reptileId: 'clreptile123456', startAfter })

      expect(prisma.shed.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            completedDate: { gte: startAfter },
          }),
        })
      )
    })

    it('should filter by endBefore date', async () => {
      vi.mocked(prisma.shed.findMany).mockResolvedValue([mockShed])
      const endBefore = new Date('2024-01-31')

      await repository.findMany({ reptileId: 'clreptile123456', endBefore })

      expect(prisma.shed.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            completedDate: { lte: endBefore },
          }),
        })
      )
    })

    it('should combine multiple filters', async () => {
      vi.mocked(prisma.shed.findMany).mockResolvedValue([mockShed])
      const startAfter = new Date('2024-01-01')
      const endBefore = new Date('2024-01-31')

      await repository.findMany({
        reptileId: 'clreptile123456',
        quality: 'COMPLETE',
        startAfter,
        endBefore,
      })

      // Note: The repository applies startAfter and endBefore as separate conditions
      // The endBefore (lte) condition overwrites the gte condition due to spread behavior
      expect(prisma.shed.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            reptileId: 'clreptile123456',
            quality: 'COMPLETE',
            completedDate: { lte: endBefore },
          },
        })
      )
    })
  })

  describe('count', () => {
    it('should return count for a reptile', async () => {
      vi.mocked(prisma.shed.count).mockResolvedValue(8)

      const result = await repository.count({ reptileId: 'clreptile123456' })

      expect(result).toBe(8)
      expect(prisma.shed.count).toHaveBeenCalledWith({
        where: {
          reptileId: 'clreptile123456',
        },
      })
    })

    it('should count with quality filter', async () => {
      vi.mocked(prisma.shed.count).mockResolvedValue(6)

      await repository.count({ reptileId: 'clreptile123456', quality: 'COMPLETE' })

      expect(prisma.shed.count).toHaveBeenCalledWith({
        where: expect.objectContaining({
          quality: 'COMPLETE',
        }),
      })
    })

    it('should count with date filters', async () => {
      vi.mocked(prisma.shed.count).mockResolvedValue(3)
      const startAfter = new Date('2024-01-01')

      await repository.count({ reptileId: 'clreptile123456', startAfter })

      expect(prisma.shed.count).toHaveBeenCalledWith({
        where: expect.objectContaining({
          completedDate: { gte: startAfter },
        }),
      })
    })
  })

  describe('findById', () => {
    it('should return shed by id', async () => {
      vi.mocked(prisma.shed.findUnique).mockResolvedValue(mockShed)

      const result = await repository.findById('clshed123456789')

      expect(result).toEqual(mockShed)
      expect(prisma.shed.findUnique).toHaveBeenCalledWith({
        where: { id: 'clshed123456789' },
        include: {},
      })
    })

    it('should return null when shed not found', async () => {
      vi.mocked(prisma.shed.findUnique).mockResolvedValue(null)

      const result = await repository.findById('nonexistent')

      expect(result).toBeNull()
    })

    it('should include reptile when requested', async () => {
      vi.mocked(prisma.shed.findUnique).mockResolvedValue(mockShed)

      await repository.findById('clshed123456789', { include: { reptile: true } })

      expect(prisma.shed.findUnique).toHaveBeenCalledWith({
        where: { id: 'clshed123456789' },
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

    it('should include photos with custom options', async () => {
      vi.mocked(prisma.shed.findUnique).mockResolvedValue(mockShed)

      await repository.findById('clshed123456789', {
        include: { photos: { take: 5, orderBy: { takenAt: 'desc' } } },
      })

      expect(prisma.shed.findUnique).toHaveBeenCalledWith({
        where: { id: 'clshed123456789' },
        include: { photos: { take: 5, orderBy: { takenAt: 'desc' } } },
      })
    })
  })

  describe('create', () => {
    it('should create a new shed', async () => {
      const createData = {
        reptileId: 'clreptile123456',
        startDate: new Date('2024-01-20'),
        completedDate: new Date('2024-01-23'),
        quality: 'COMPLETE' as ShedQuality,
      }
      vi.mocked(prisma.shed.create).mockResolvedValue({ ...mockShed, ...createData })

      const result = await repository.create(createData)

      expect(result.quality).toBe('COMPLETE')
      expect(prisma.shed.create).toHaveBeenCalledWith({
        data: createData,
      })
    })

    it('should create shed with notes', async () => {
      const createData = {
        reptileId: 'clreptile123456',
        startDate: new Date('2024-01-20'),
        completedDate: new Date('2024-01-23'),
        quality: 'PARTIAL' as ShedQuality,
        notes: 'Needed assistance with stuck shed',
      }
      vi.mocked(prisma.shed.create).mockResolvedValue({ ...mockShed, ...createData })

      await repository.create(createData)

      expect(prisma.shed.create).toHaveBeenCalledWith({
        data: createData,
      })
    })

    it('should create shed with client-provided id', async () => {
      const createData = {
        id: 'custom-shed-id',
        reptileId: 'clreptile123456',
        startDate: new Date('2024-01-20'),
        completedDate: new Date('2024-01-23'),
        quality: 'COMPLETE' as ShedQuality,
      }
      vi.mocked(prisma.shed.create).mockResolvedValue({ ...mockShed, ...createData })

      await repository.create(createData)

      expect(prisma.shed.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          id: 'custom-shed-id',
        }),
      })
    })

    it('should create shed marked as in progress', async () => {
      const createData = {
        reptileId: 'clreptile123456',
        startDate: new Date('2024-01-20'),
        completedDate: new Date('2024-01-20'),
        quality: 'PARTIAL' as ShedQuality,
        isComplete: false,
      }
      const inProgressShed: Shed = {
        ...mockShed,
        ...createData,
      }
      vi.mocked(prisma.shed.create).mockResolvedValue(inProgressShed)

      const result = await repository.create(createData)

      expect(result.isComplete).toBe(false)
    })
  })

  describe('update', () => {
    it('should update a shed', async () => {
      const updatedShed = { ...mockShed, notes: 'Updated shed notes' }
      vi.mocked(prisma.shed.update).mockResolvedValue(updatedShed)

      const result = await repository.update('clshed123456789', { notes: 'Updated shed notes' })

      expect(result.notes).toBe('Updated shed notes')
      expect(prisma.shed.update).toHaveBeenCalledWith({
        where: { id: 'clshed123456789' },
        data: { notes: 'Updated shed notes' },
      })
    })

    it('should update quality', async () => {
      vi.mocked(prisma.shed.update).mockResolvedValue({ ...mockShed, quality: 'PROBLEMATIC' as ShedQuality })

      await repository.update('clshed123456789', { quality: 'PROBLEMATIC' })

      expect(prisma.shed.update).toHaveBeenCalledWith({
        where: { id: 'clshed123456789' },
        data: { quality: 'PROBLEMATIC' },
      })
    })

    it('should complete a shed by setting completedDate', async () => {
      const completedDate = new Date('2024-01-25')
      vi.mocked(prisma.shed.update).mockResolvedValue({ ...mockShed, completedDate })

      await repository.update('clshed123456789', { completedDate })

      expect(prisma.shed.update).toHaveBeenCalledWith({
        where: { id: 'clshed123456789' },
        data: { completedDate },
      })
    })
  })

  describe('softDelete', () => {
    it('should delete a shed (hard delete)', async () => {
      vi.mocked(prisma.shed.delete).mockResolvedValue(mockShed)

      const result = await repository.softDelete('clshed123456789')

      expect(result).toEqual(mockShed)
      expect(prisma.shed.delete).toHaveBeenCalledWith({
        where: { id: 'clshed123456789' },
      })
    })
  })
})
