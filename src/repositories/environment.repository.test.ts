// Environment Repository Tests
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { EnvironmentRepository } from './environment.repository'
import { prisma } from '@/lib/db/client'
import type { EnvironmentLog } from '@/generated/prisma/client'
import { Prisma } from '@/generated/prisma/client'

// Mock the prisma client
vi.mock('@/lib/db/client', () => ({
  prisma: {
    environmentLog: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
  },
}))

// Mock environment log for testing
const mockEnvLog: EnvironmentLog = {
  id: 'clenv123456789',
  reptileId: 'clreptile123456',
  date: new Date('2024-01-15T10:00:00Z'),
  temperature: new Prisma.Decimal(85.5),
  humidity: new Prisma.Decimal(65.0),
  location: 'warm_side',
  isAlert: false,
  notes: 'Normal readings',
  createdAt: new Date('2024-01-15'),
}

const mockAlertLog: EnvironmentLog = {
  ...mockEnvLog,
  id: 'clenv123456790',
  temperature: new Prisma.Decimal(95.0),
  isAlert: true,
  notes: 'Temperature too high!',
}

describe('EnvironmentRepository', () => {
  let repository: EnvironmentRepository

  beforeEach(() => {
    vi.clearAllMocks()
    repository = new EnvironmentRepository()
  })

  describe('findMany', () => {
    it('should return environment logs for a reptile with default options', async () => {
      vi.mocked(prisma.environmentLog.findMany).mockResolvedValue([mockEnvLog])

      const result = await repository.findMany({ reptileId: 'clreptile123456' })

      expect(result).toEqual([mockEnvLog])
      expect(prisma.environmentLog.findMany).toHaveBeenCalledWith({
        where: {
          reptileId: 'clreptile123456',
        },
        skip: 0,
        take: 20,
        orderBy: { date: 'desc' },
      })
    })

    it('should apply pagination options', async () => {
      vi.mocked(prisma.environmentLog.findMany).mockResolvedValue([mockEnvLog])

      await repository.findMany({ reptileId: 'clreptile123456', skip: 20, take: 10 })

      expect(prisma.environmentLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 20,
          take: 10,
        })
      )
    })

    it('should apply custom orderBy', async () => {
      vi.mocked(prisma.environmentLog.findMany).mockResolvedValue([mockEnvLog])

      await repository.findMany({
        reptileId: 'clreptile123456',
        orderBy: { temperature: 'asc' },
      })

      expect(prisma.environmentLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { temperature: 'asc' },
        })
      )
    })

    it('should filter by startDate only', async () => {
      vi.mocked(prisma.environmentLog.findMany).mockResolvedValue([mockEnvLog])
      const startDate = new Date('2024-01-01')

      await repository.findMany({ reptileId: 'clreptile123456', startDate })

      expect(prisma.environmentLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            date: { gte: startDate },
          }),
        })
      )
    })

    it('should filter by endDate only', async () => {
      vi.mocked(prisma.environmentLog.findMany).mockResolvedValue([mockEnvLog])
      const endDate = new Date('2024-01-31')

      await repository.findMany({ reptileId: 'clreptile123456', endDate })

      expect(prisma.environmentLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            date: { lte: endDate },
          }),
        })
      )
    })

    it('should filter by date range (both dates)', async () => {
      vi.mocked(prisma.environmentLog.findMany).mockResolvedValue([mockEnvLog])
      const startDate = new Date('2024-01-01')
      const endDate = new Date('2024-01-31')

      await repository.findMany({ reptileId: 'clreptile123456', startDate, endDate })

      expect(prisma.environmentLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            date: { gte: startDate, lte: endDate },
          }),
        })
      )
    })

    it('should filter by location', async () => {
      vi.mocked(prisma.environmentLog.findMany).mockResolvedValue([mockEnvLog])

      await repository.findMany({ reptileId: 'clreptile123456', location: 'warm_side' })

      expect(prisma.environmentLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            location: 'warm_side',
          }),
        })
      )
    })

    it('should filter alerts only', async () => {
      vi.mocked(prisma.environmentLog.findMany).mockResolvedValue([mockAlertLog])

      await repository.findMany({ reptileId: 'clreptile123456', alertsOnly: true })

      expect(prisma.environmentLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            isAlert: true,
          }),
        })
      )
    })

    it('should not filter by alerts when alertsOnly is false', async () => {
      vi.mocked(prisma.environmentLog.findMany).mockResolvedValue([mockEnvLog, mockAlertLog])

      await repository.findMany({ reptileId: 'clreptile123456', alertsOnly: false })

      expect(prisma.environmentLog.findMany).toHaveBeenCalledWith({
        where: {
          reptileId: 'clreptile123456',
        },
        skip: 0,
        take: 20,
        orderBy: { date: 'desc' },
      })
    })

    it('should combine multiple filters', async () => {
      vi.mocked(prisma.environmentLog.findMany).mockResolvedValue([mockAlertLog])
      const startDate = new Date('2024-01-01')
      const endDate = new Date('2024-01-31')

      await repository.findMany({
        reptileId: 'clreptile123456',
        startDate,
        endDate,
        location: 'warm_side',
        alertsOnly: true,
      })

      expect(prisma.environmentLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            reptileId: 'clreptile123456',
            date: { gte: startDate, lte: endDate },
            location: 'warm_side',
            isAlert: true,
          },
        })
      )
    })
  })

  describe('count', () => {
    it('should return count for a reptile', async () => {
      vi.mocked(prisma.environmentLog.count).mockResolvedValue(100)

      const result = await repository.count({ reptileId: 'clreptile123456' })

      expect(result).toBe(100)
      expect(prisma.environmentLog.count).toHaveBeenCalledWith({
        where: {
          reptileId: 'clreptile123456',
        },
      })
    })

    it('should count with location filter', async () => {
      vi.mocked(prisma.environmentLog.count).mockResolvedValue(50)

      await repository.count({ reptileId: 'clreptile123456', location: 'cool_side' })

      expect(prisma.environmentLog.count).toHaveBeenCalledWith({
        where: expect.objectContaining({
          location: 'cool_side',
        }),
      })
    })

    it('should count alerts only', async () => {
      vi.mocked(prisma.environmentLog.count).mockResolvedValue(5)

      await repository.count({ reptileId: 'clreptile123456', alertsOnly: true })

      expect(prisma.environmentLog.count).toHaveBeenCalledWith({
        where: expect.objectContaining({
          isAlert: true,
        }),
      })
    })

    it('should count with date range', async () => {
      vi.mocked(prisma.environmentLog.count).mockResolvedValue(30)
      const startDate = new Date('2024-01-01')
      const endDate = new Date('2024-01-31')

      await repository.count({ reptileId: 'clreptile123456', startDate, endDate })

      expect(prisma.environmentLog.count).toHaveBeenCalledWith({
        where: expect.objectContaining({
          date: { gte: startDate, lte: endDate },
        }),
      })
    })
  })

  describe('findById', () => {
    it('should return environment log by id', async () => {
      vi.mocked(prisma.environmentLog.findUnique).mockResolvedValue(mockEnvLog)

      const result = await repository.findById('clenv123456789')

      expect(result).toEqual(mockEnvLog)
      expect(prisma.environmentLog.findUnique).toHaveBeenCalledWith({
        where: { id: 'clenv123456789' },
      })
    })

    it('should return null when environment log not found', async () => {
      vi.mocked(prisma.environmentLog.findUnique).mockResolvedValue(null)

      const result = await repository.findById('nonexistent')

      expect(result).toBeNull()
    })
  })

  describe('create', () => {
    it('should create a new environment log', async () => {
      const createData = {
        reptileId: 'clreptile123456',
        date: new Date('2024-01-20T14:00:00Z'),
        temperature: new Prisma.Decimal(82.0),
        humidity: new Prisma.Decimal(70.0),
      }
      vi.mocked(prisma.environmentLog.create).mockResolvedValue({ ...mockEnvLog, ...createData })

      const result = await repository.create(createData)

      expect(result.temperature).toEqual(new Prisma.Decimal(82.0))
      expect(prisma.environmentLog.create).toHaveBeenCalledWith({
        data: createData,
      })
    })

    it('should create environment log with all fields', async () => {
      const createData = {
        reptileId: 'clreptile123456',
        date: new Date('2024-01-20T14:00:00Z'),
        temperature: new Prisma.Decimal(95.5),
        humidity: new Prisma.Decimal(80.0),
        location: 'warm_side',
        isAlert: true,
        notes: 'Temperature spike detected',
      }
      vi.mocked(prisma.environmentLog.create).mockResolvedValue({ ...mockEnvLog, ...createData })

      await repository.create(createData)

      expect(prisma.environmentLog.create).toHaveBeenCalledWith({
        data: createData,
      })
    })

    it('should create environment log with client-provided id', async () => {
      const createData = {
        id: 'custom-env-id',
        reptileId: 'clreptile123456',
        date: new Date('2024-01-20T14:00:00Z'),
        temperature: new Prisma.Decimal(85.0),
        humidity: new Prisma.Decimal(65.0),
      }
      vi.mocked(prisma.environmentLog.create).mockResolvedValue({ ...mockEnvLog, ...createData })

      await repository.create(createData)

      expect(prisma.environmentLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          id: 'custom-env-id',
        }),
      })
    })

    it('should handle temperature-only readings', async () => {
      const createData = {
        reptileId: 'clreptile123456',
        date: new Date('2024-01-20T14:00:00Z'),
        temperature: new Prisma.Decimal(88.0),
        humidity: null,
      }
      vi.mocked(prisma.environmentLog.create).mockResolvedValue({ ...mockEnvLog, ...createData })

      await repository.create(createData)

      expect(prisma.environmentLog.create).toHaveBeenCalledWith({
        data: createData,
      })
    })
  })

  describe('update', () => {
    it('should update an environment log', async () => {
      const updatedLog = { ...mockEnvLog, temperature: new Prisma.Decimal(86.0) }
      vi.mocked(prisma.environmentLog.update).mockResolvedValue(updatedLog)

      const result = await repository.update('clenv123456789', { temperature: new Prisma.Decimal(86.0) })

      expect(result.temperature).toEqual(new Prisma.Decimal(86.0))
      expect(prisma.environmentLog.update).toHaveBeenCalledWith({
        where: { id: 'clenv123456789' },
        data: { temperature: new Prisma.Decimal(86.0) },
      })
    })

    it('should update multiple fields', async () => {
      vi.mocked(prisma.environmentLog.update).mockResolvedValue({
        ...mockEnvLog,
        temperature: new Prisma.Decimal(92.0),
        isAlert: true,
        notes: 'Temperature corrected',
      })

      await repository.update('clenv123456789', {
        temperature: new Prisma.Decimal(92.0),
        isAlert: true,
        notes: 'Temperature corrected',
      })

      expect(prisma.environmentLog.update).toHaveBeenCalledWith({
        where: { id: 'clenv123456789' },
        data: {
          temperature: new Prisma.Decimal(92.0),
          isAlert: true,
          notes: 'Temperature corrected',
        },
      })
    })

    it('should update location', async () => {
      vi.mocked(prisma.environmentLog.update).mockResolvedValue({ ...mockEnvLog, location: 'cool_side' })

      await repository.update('clenv123456789', { location: 'cool_side' })

      expect(prisma.environmentLog.update).toHaveBeenCalledWith({
        where: { id: 'clenv123456789' },
        data: { location: 'cool_side' },
      })
    })

    it('should clear alert status', async () => {
      vi.mocked(prisma.environmentLog.update).mockResolvedValue({ ...mockAlertLog, isAlert: false })

      await repository.update('clenv123456790', { isAlert: false })

      expect(prisma.environmentLog.update).toHaveBeenCalledWith({
        where: { id: 'clenv123456790' },
        data: { isAlert: false },
      })
    })
  })

  describe('delete', () => {
    it('should delete an environment log', async () => {
      vi.mocked(prisma.environmentLog.delete).mockResolvedValue(mockEnvLog)

      const result = await repository.delete('clenv123456789')

      expect(result).toEqual(mockEnvLog)
      expect(prisma.environmentLog.delete).toHaveBeenCalledWith({
        where: { id: 'clenv123456789' },
      })
    })
  })
})
