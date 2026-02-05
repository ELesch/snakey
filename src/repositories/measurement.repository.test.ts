// Measurement Repository Tests
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MeasurementRepository } from './measurement.repository'
import { prisma } from '@/lib/db/client'
import type { Measurement, MeasurementType } from '@/generated/prisma/client'

// Mock the prisma client
vi.mock('@/lib/db/client', () => ({
  prisma: {
    measurement: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
  },
}))

// Mock measurement for testing
const mockMeasurement: Measurement = {
  id: 'clmeasurement123456789',
  reptileId: 'clreptile123456',
  date: new Date('2024-01-15'),
  type: 'WEIGHT' as MeasurementType,
  value: 450.5,
  unit: 'g',
  notes: 'Post-feeding weight',
  createdAt: new Date('2024-01-15'),
}

const mockLengthMeasurement: Measurement = {
  ...mockMeasurement,
  id: 'clmeasurement123456790',
  type: 'LENGTH' as MeasurementType,
  value: 120,
  unit: 'cm',
  notes: 'Full length measurement',
}

const mockShellMeasurement: Measurement = {
  ...mockMeasurement,
  id: 'clmeasurement123456791',
  type: 'SHELL_LENGTH' as MeasurementType,
  value: 25,
  unit: 'cm',
  notes: null,
}

describe('MeasurementRepository', () => {
  let repository: MeasurementRepository

  beforeEach(() => {
    vi.clearAllMocks()
    repository = new MeasurementRepository()
  })

  describe('findMany', () => {
    it('should return measurements for a reptile with default options', async () => {
      vi.mocked(prisma.measurement.findMany).mockResolvedValue([mockMeasurement])

      const result = await repository.findMany({ reptileId: 'clreptile123456' })

      expect(result).toEqual([mockMeasurement])
      expect(prisma.measurement.findMany).toHaveBeenCalledWith({
        where: {
          reptileId: 'clreptile123456',
        },
        skip: 0,
        take: 20,
        orderBy: { date: 'desc' },
      })
    })

    it('should apply pagination options', async () => {
      vi.mocked(prisma.measurement.findMany).mockResolvedValue([mockMeasurement])

      await repository.findMany({ reptileId: 'clreptile123456', skip: 10, take: 5 })

      expect(prisma.measurement.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10,
          take: 5,
        })
      )
    })

    it('should apply custom orderBy', async () => {
      vi.mocked(prisma.measurement.findMany).mockResolvedValue([mockMeasurement])

      await repository.findMany({
        reptileId: 'clreptile123456',
        orderBy: { createdAt: 'asc' },
      })

      expect(prisma.measurement.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { createdAt: 'asc' },
        })
      )
    })

    it('should filter by measurement type', async () => {
      vi.mocked(prisma.measurement.findMany).mockResolvedValue([mockLengthMeasurement])

      await repository.findMany({ reptileId: 'clreptile123456', type: 'LENGTH' })

      expect(prisma.measurement.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            type: 'LENGTH',
          }),
        })
      )
    })

    it('should filter by startDate only', async () => {
      vi.mocked(prisma.measurement.findMany).mockResolvedValue([mockMeasurement])
      const startDate = new Date('2024-01-01')

      await repository.findMany({
        reptileId: 'clreptile123456',
        startDate,
      })

      expect(prisma.measurement.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            date: { gte: startDate },
          }),
        })
      )
    })

    it('should filter by endDate only', async () => {
      vi.mocked(prisma.measurement.findMany).mockResolvedValue([mockMeasurement])
      const endDate = new Date('2024-01-31')

      await repository.findMany({
        reptileId: 'clreptile123456',
        endDate,
      })

      expect(prisma.measurement.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            date: { lte: endDate },
          }),
        })
      )
    })

    it('should filter by date range', async () => {
      vi.mocked(prisma.measurement.findMany).mockResolvedValue([mockMeasurement])
      const startDate = new Date('2024-01-01')
      const endDate = new Date('2024-01-31')

      await repository.findMany({
        reptileId: 'clreptile123456',
        startDate,
        endDate,
      })

      expect(prisma.measurement.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            date: { gte: startDate, lte: endDate },
          }),
        })
      )
    })

    it('should combine type and date filters', async () => {
      vi.mocked(prisma.measurement.findMany).mockResolvedValue([mockMeasurement])
      const startDate = new Date('2024-01-01')
      const endDate = new Date('2024-01-31')

      await repository.findMany({
        reptileId: 'clreptile123456',
        type: 'WEIGHT',
        startDate,
        endDate,
      })

      expect(prisma.measurement.findMany).toHaveBeenCalledWith({
        where: {
          reptileId: 'clreptile123456',
          type: 'WEIGHT',
          date: { gte: startDate, lte: endDate },
        },
        skip: 0,
        take: 20,
        orderBy: { date: 'desc' },
      })
    })

    it('should return empty array when no measurements exist', async () => {
      vi.mocked(prisma.measurement.findMany).mockResolvedValue([])

      const result = await repository.findMany({ reptileId: 'clreptile123456' })

      expect(result).toEqual([])
    })

    it('should return multiple measurements', async () => {
      vi.mocked(prisma.measurement.findMany).mockResolvedValue([
        mockMeasurement,
        mockLengthMeasurement,
        mockShellMeasurement,
      ])

      const result = await repository.findMany({ reptileId: 'clreptile123456' })

      expect(result).toHaveLength(3)
    })
  })

  describe('count', () => {
    it('should return count for a reptile', async () => {
      vi.mocked(prisma.measurement.count).mockResolvedValue(15)

      const result = await repository.count({ reptileId: 'clreptile123456' })

      expect(result).toBe(15)
      expect(prisma.measurement.count).toHaveBeenCalledWith({
        where: {
          reptileId: 'clreptile123456',
        },
      })
    })

    it('should count with type filter', async () => {
      vi.mocked(prisma.measurement.count).mockResolvedValue(5)

      await repository.count({ reptileId: 'clreptile123456', type: 'WEIGHT' })

      expect(prisma.measurement.count).toHaveBeenCalledWith({
        where: expect.objectContaining({
          type: 'WEIGHT',
        }),
      })
    })

    it('should count with date range filter', async () => {
      vi.mocked(prisma.measurement.count).mockResolvedValue(10)
      const startDate = new Date('2024-01-01')
      const endDate = new Date('2024-01-31')

      await repository.count({ reptileId: 'clreptile123456', startDate, endDate })

      expect(prisma.measurement.count).toHaveBeenCalledWith({
        where: expect.objectContaining({
          date: { gte: startDate, lte: endDate },
        }),
      })
    })

    it('should combine type and date filters when counting', async () => {
      vi.mocked(prisma.measurement.count).mockResolvedValue(3)
      const startDate = new Date('2024-01-01')
      const endDate = new Date('2024-01-31')

      await repository.count({
        reptileId: 'clreptile123456',
        type: 'LENGTH',
        startDate,
        endDate,
      })

      expect(prisma.measurement.count).toHaveBeenCalledWith({
        where: {
          reptileId: 'clreptile123456',
          type: 'LENGTH',
          date: { gte: startDate, lte: endDate },
        },
      })
    })
  })

  describe('findById', () => {
    it('should return measurement by id', async () => {
      vi.mocked(prisma.measurement.findUnique).mockResolvedValue(mockMeasurement)

      const result = await repository.findById('clmeasurement123456789')

      expect(result).toEqual(mockMeasurement)
      expect(prisma.measurement.findUnique).toHaveBeenCalledWith({
        where: { id: 'clmeasurement123456789' },
        include: undefined,
      })
    })

    it('should return null when measurement not found', async () => {
      vi.mocked(prisma.measurement.findUnique).mockResolvedValue(null)

      const result = await repository.findById('nonexistent')

      expect(result).toBeNull()
    })

    it('should include reptile when requested', async () => {
      const measurementWithReptile = {
        ...mockMeasurement,
        reptile: { id: 'clreptile123456', userId: 'user-123', deletedAt: null },
      }
      vi.mocked(prisma.measurement.findUnique).mockResolvedValue(measurementWithReptile)

      await repository.findById('clmeasurement123456789', { includeReptile: true })

      expect(prisma.measurement.findUnique).toHaveBeenCalledWith({
        where: { id: 'clmeasurement123456789' },
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

    it('should not include reptile by default', async () => {
      vi.mocked(prisma.measurement.findUnique).mockResolvedValue(mockMeasurement)

      await repository.findById('clmeasurement123456789')

      expect(prisma.measurement.findUnique).toHaveBeenCalledWith({
        where: { id: 'clmeasurement123456789' },
        include: undefined,
      })
    })
  })

  describe('create', () => {
    it('should create a new measurement with required fields', async () => {
      const createData = {
        reptileId: 'clreptile123456',
        date: new Date('2024-01-20'),
        type: 'WEIGHT' as MeasurementType,
        value: 500,
        unit: 'g',
      }
      vi.mocked(prisma.measurement.create).mockResolvedValue({ ...mockMeasurement, ...createData })

      const result = await repository.create(createData)

      expect(result.value).toBe(500)
      expect(prisma.measurement.create).toHaveBeenCalledWith({
        data: createData,
      })
    })

    it('should create measurement with all optional fields', async () => {
      const createData = {
        reptileId: 'clreptile123456',
        date: new Date('2024-01-20'),
        type: 'LENGTH' as MeasurementType,
        value: 125,
        unit: 'cm',
        notes: 'Measured from head to tail tip',
      }
      vi.mocked(prisma.measurement.create).mockResolvedValue({ ...mockMeasurement, ...createData })

      const result = await repository.create(createData)

      expect(result.notes).toBe('Measured from head to tail tip')
      expect(prisma.measurement.create).toHaveBeenCalledWith({
        data: createData,
      })
    })

    it('should create measurement with client-provided id', async () => {
      const createData = {
        id: 'custom-measurement-id',
        reptileId: 'clreptile123456',
        date: new Date('2024-01-20'),
        type: 'WEIGHT' as MeasurementType,
        value: 500,
        unit: 'g',
      }
      vi.mocked(prisma.measurement.create).mockResolvedValue({ ...mockMeasurement, ...createData })

      await repository.create(createData)

      expect(prisma.measurement.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          id: 'custom-measurement-id',
        }),
      })
    })

    it('should create measurement with null notes', async () => {
      const createData = {
        reptileId: 'clreptile123456',
        date: new Date('2024-01-20'),
        type: 'SHELL_WIDTH' as MeasurementType,
        value: 15,
        unit: 'cm',
        notes: null,
      }
      vi.mocked(prisma.measurement.create).mockResolvedValue({ ...mockMeasurement, ...createData })

      await repository.create(createData)

      expect(prisma.measurement.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          notes: null,
        }),
      })
    })
  })

  describe('update', () => {
    it('should update a measurement', async () => {
      const updatedMeasurement = { ...mockMeasurement, value: 475 }
      vi.mocked(prisma.measurement.update).mockResolvedValue(updatedMeasurement)

      const result = await repository.update('clmeasurement123456789', { value: 475 })

      expect(result.value).toBe(475)
      expect(prisma.measurement.update).toHaveBeenCalledWith({
        where: { id: 'clmeasurement123456789' },
        data: { value: 475 },
      })
    })

    it('should update measurement notes', async () => {
      vi.mocked(prisma.measurement.update).mockResolvedValue({
        ...mockMeasurement,
        notes: 'Updated notes',
      })

      await repository.update('clmeasurement123456789', { notes: 'Updated notes' })

      expect(prisma.measurement.update).toHaveBeenCalledWith({
        where: { id: 'clmeasurement123456789' },
        data: { notes: 'Updated notes' },
      })
    })

    it('should update measurement type', async () => {
      vi.mocked(prisma.measurement.update).mockResolvedValue({
        ...mockMeasurement,
        type: 'LENGTH' as MeasurementType,
      })

      await repository.update('clmeasurement123456789', { type: 'LENGTH' })

      expect(prisma.measurement.update).toHaveBeenCalledWith({
        where: { id: 'clmeasurement123456789' },
        data: { type: 'LENGTH' },
      })
    })

    it('should update measurement date', async () => {
      const newDate = new Date('2024-02-01')
      vi.mocked(prisma.measurement.update).mockResolvedValue({
        ...mockMeasurement,
        date: newDate,
      })

      await repository.update('clmeasurement123456789', { date: newDate })

      expect(prisma.measurement.update).toHaveBeenCalledWith({
        where: { id: 'clmeasurement123456789' },
        data: { date: newDate },
      })
    })

    it('should update measurement unit', async () => {
      vi.mocked(prisma.measurement.update).mockResolvedValue({
        ...mockMeasurement,
        unit: 'oz',
      })

      await repository.update('clmeasurement123456789', { unit: 'oz' })

      expect(prisma.measurement.update).toHaveBeenCalledWith({
        where: { id: 'clmeasurement123456789' },
        data: { unit: 'oz' },
      })
    })

    it('should clear notes by setting to null', async () => {
      vi.mocked(prisma.measurement.update).mockResolvedValue({ ...mockMeasurement, notes: null })

      await repository.update('clmeasurement123456789', { notes: null })

      expect(prisma.measurement.update).toHaveBeenCalledWith({
        where: { id: 'clmeasurement123456789' },
        data: { notes: null },
      })
    })

    it('should update multiple fields at once', async () => {
      vi.mocked(prisma.measurement.update).mockResolvedValue({
        ...mockMeasurement,
        value: 500,
        unit: 'g',
        notes: 'New notes',
      })

      await repository.update('clmeasurement123456789', {
        value: 500,
        unit: 'g',
        notes: 'New notes',
      })

      expect(prisma.measurement.update).toHaveBeenCalledWith({
        where: { id: 'clmeasurement123456789' },
        data: {
          value: 500,
          unit: 'g',
          notes: 'New notes',
        },
      })
    })
  })

  describe('delete', () => {
    it('should hard delete a measurement', async () => {
      vi.mocked(prisma.measurement.delete).mockResolvedValue(mockMeasurement)

      const result = await repository.delete('clmeasurement123456789')

      expect(result).toEqual(mockMeasurement)
      expect(prisma.measurement.delete).toHaveBeenCalledWith({
        where: { id: 'clmeasurement123456789' },
      })
    })

    it('should return the deleted measurement', async () => {
      vi.mocked(prisma.measurement.delete).mockResolvedValue(mockLengthMeasurement)

      const result = await repository.delete('clmeasurement123456790')

      expect(result.id).toBe('clmeasurement123456790')
      expect(result.type).toBe('LENGTH')
    })
  })
})
