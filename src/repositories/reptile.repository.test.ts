// Reptile Repository Tests
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ReptileRepository } from './reptile.repository'
import { prisma } from '@/lib/db/client'
import type { Reptile, Sex } from '@/generated/prisma/client'

// Mock the prisma client
vi.mock('@/lib/db/client', () => ({
  prisma: {
    reptile: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
  },
}))

// Mock reptile for testing
const mockReptile: Reptile = {
  id: 'cltest123456789',
  userId: 'user-123',
  name: 'Luna',
  species: 'ball_python',
  morph: 'Banana Pied',
  sex: 'FEMALE' as Sex,
  birthDate: new Date('2022-06-15'),
  acquisitionDate: new Date('2022-09-01'),
  notes: 'Great eater',
  isPublic: false,
  shareId: null,
  createdAt: new Date('2022-09-01'),
  updatedAt: new Date('2024-01-15'),
  deletedAt: null,
}

const mockReptile2: Reptile = {
  ...mockReptile,
  id: 'cltest123456790',
  name: 'Apollo',
  species: 'corn_snake',
  sex: 'MALE' as Sex,
}

const mockDeletedReptile: Reptile = {
  ...mockReptile,
  id: 'cldeleted123456',
  deletedAt: new Date('2024-01-20'),
}

describe('ReptileRepository', () => {
  let repository: ReptileRepository

  beforeEach(() => {
    vi.clearAllMocks()
    repository = new ReptileRepository()
  })

  describe('findMany', () => {
    it('should return reptiles for a user with default options', async () => {
      vi.mocked(prisma.reptile.findMany).mockResolvedValue([mockReptile])

      const result = await repository.findMany({ userId: 'user-123' })

      expect(result).toEqual([mockReptile])
      expect(prisma.reptile.findMany).toHaveBeenCalledWith({
        where: {
          userId: 'user-123',
          deletedAt: null,
        },
        skip: 0,
        take: 20,
        orderBy: { createdAt: 'desc' },
      })
    })

    it('should apply pagination options', async () => {
      vi.mocked(prisma.reptile.findMany).mockResolvedValue([mockReptile])

      await repository.findMany({ userId: 'user-123', skip: 10, take: 5 })

      expect(prisma.reptile.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10,
          take: 5,
        })
      )
    })

    it('should apply custom orderBy', async () => {
      vi.mocked(prisma.reptile.findMany).mockResolvedValue([mockReptile])

      await repository.findMany({
        userId: 'user-123',
        orderBy: { name: 'asc' },
      })

      expect(prisma.reptile.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { name: 'asc' },
        })
      )
    })

    it('should filter by species', async () => {
      vi.mocked(prisma.reptile.findMany).mockResolvedValue([mockReptile])

      await repository.findMany({ userId: 'user-123', species: 'ball_python' })

      expect(prisma.reptile.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            species: 'ball_python',
          }),
        })
      )
    })

    it('should filter by sex', async () => {
      vi.mocked(prisma.reptile.findMany).mockResolvedValue([mockReptile])

      await repository.findMany({ userId: 'user-123', sex: 'FEMALE' })

      expect(prisma.reptile.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            sex: 'FEMALE',
          }),
        })
      )
    })

    it('should apply search filter to name and morph', async () => {
      vi.mocked(prisma.reptile.findMany).mockResolvedValue([mockReptile])

      await repository.findMany({ userId: 'user-123', search: 'Luna' })

      expect(prisma.reptile.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: [
              { name: { contains: 'Luna', mode: 'insensitive' } },
              { morph: { contains: 'Luna', mode: 'insensitive' } },
            ],
          }),
        })
      )
    })

    it('should include deleted reptiles when requested', async () => {
      vi.mocked(prisma.reptile.findMany).mockResolvedValue([mockReptile, mockDeletedReptile])

      await repository.findMany({ userId: 'user-123', includeDeleted: true })

      expect(prisma.reptile.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            userId: 'user-123',
          },
        })
      )
    })

    it('should combine multiple filters', async () => {
      vi.mocked(prisma.reptile.findMany).mockResolvedValue([mockReptile])

      await repository.findMany({
        userId: 'user-123',
        species: 'ball_python',
        sex: 'FEMALE',
        search: 'Banana',
      })

      const calledWith = vi.mocked(prisma.reptile.findMany).mock.calls[0][0]
      expect(calledWith?.where).toMatchObject({
        userId: 'user-123',
        species: 'ball_python',
        sex: 'FEMALE',
        deletedAt: null,
      })
      expect(calledWith?.where?.OR).toBeDefined()
    })
  })

  describe('count', () => {
    it('should return count for a user with default options', async () => {
      vi.mocked(prisma.reptile.count).mockResolvedValue(5)

      const result = await repository.count({ userId: 'user-123' })

      expect(result).toBe(5)
      expect(prisma.reptile.count).toHaveBeenCalledWith({
        where: {
          userId: 'user-123',
          deletedAt: null,
        },
      })
    })

    it('should count with species filter', async () => {
      vi.mocked(prisma.reptile.count).mockResolvedValue(3)

      await repository.count({ userId: 'user-123', species: 'ball_python' })

      expect(prisma.reptile.count).toHaveBeenCalledWith({
        where: expect.objectContaining({
          species: 'ball_python',
        }),
      })
    })

    it('should count with search filter', async () => {
      vi.mocked(prisma.reptile.count).mockResolvedValue(1)

      await repository.count({ userId: 'user-123', search: 'Luna' })

      expect(prisma.reptile.count).toHaveBeenCalledWith({
        where: expect.objectContaining({
          OR: [
            { name: { contains: 'Luna', mode: 'insensitive' } },
            { morph: { contains: 'Luna', mode: 'insensitive' } },
          ],
        }),
      })
    })

    it('should include deleted when requested', async () => {
      vi.mocked(prisma.reptile.count).mockResolvedValue(10)

      await repository.count({ userId: 'user-123', includeDeleted: true })

      expect(prisma.reptile.count).toHaveBeenCalledWith({
        where: {
          userId: 'user-123',
        },
      })
    })
  })

  describe('findById', () => {
    it('should return reptile by id', async () => {
      vi.mocked(prisma.reptile.findUnique).mockResolvedValue(mockReptile)

      const result = await repository.findById('cltest123456789')

      expect(result).toEqual(mockReptile)
      expect(prisma.reptile.findUnique).toHaveBeenCalledWith({
        where: { id: 'cltest123456789' },
        include: undefined,
      })
    })

    it('should return null when reptile not found', async () => {
      vi.mocked(prisma.reptile.findUnique).mockResolvedValue(null)

      const result = await repository.findById('nonexistent')

      expect(result).toBeNull()
    })

    it('should include related data when options provided', async () => {
      vi.mocked(prisma.reptile.findUnique).mockResolvedValue(mockReptile)

      await repository.findById('cltest123456789', {
        include: {
          feedings: { take: 5, orderBy: { date: 'desc' } },
          measurements: true,
        },
      })

      expect(prisma.reptile.findUnique).toHaveBeenCalledWith({
        where: { id: 'cltest123456789' },
        include: {
          feedings: { take: 5, orderBy: { date: 'desc' } },
          measurements: true,
        },
      })
    })
  })

  describe('create', () => {
    it('should create a new reptile', async () => {
      const createData = {
        userId: 'user-123',
        name: 'Apollo',
        species: 'corn_snake',
        acquisitionDate: new Date('2023-10-15'),
        sex: 'MALE' as Sex,
        isPublic: false,
      }
      vi.mocked(prisma.reptile.create).mockResolvedValue({ ...mockReptile2, ...createData })

      const result = await repository.create(createData)

      expect(result.name).toBe('Apollo')
      expect(prisma.reptile.create).toHaveBeenCalledWith({
        data: createData,
      })
    })

    it('should create reptile with all optional fields', async () => {
      const createData = {
        userId: 'user-123',
        name: 'Apollo',
        species: 'corn_snake',
        morph: 'Anerythristic',
        sex: 'MALE' as Sex,
        birthDate: new Date('2023-07-20'),
        acquisitionDate: new Date('2023-10-15'),
        currentWeight: null,
        notes: 'Purchased from breeder',
        isPublic: true,
        shareId: 'share123',
      }
      vi.mocked(prisma.reptile.create).mockResolvedValue({ ...mockReptile2, ...createData })

      await repository.create(createData)

      expect(prisma.reptile.create).toHaveBeenCalledWith({
        data: createData,
      })
    })

    it('should create reptile with client-provided id', async () => {
      const createData = {
        id: 'custom-id-123',
        userId: 'user-123',
        name: 'Apollo',
        species: 'corn_snake',
        acquisitionDate: new Date('2023-10-15'),
        sex: 'MALE' as Sex,
        isPublic: false,
      }
      vi.mocked(prisma.reptile.create).mockResolvedValue({ ...mockReptile2, ...createData })

      await repository.create(createData)

      expect(prisma.reptile.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          id: 'custom-id-123',
        }),
      })
    })
  })

  describe('update', () => {
    it('should update a reptile', async () => {
      const updatedReptile = { ...mockReptile, name: 'Luna Updated' }
      vi.mocked(prisma.reptile.update).mockResolvedValue(updatedReptile)

      const result = await repository.update('cltest123456789', { name: 'Luna Updated' })

      expect(result.name).toBe('Luna Updated')
      expect(prisma.reptile.update).toHaveBeenCalledWith({
        where: { id: 'cltest123456789' },
        data: { name: 'Luna Updated' },
      })
    })

    it('should allow partial updates', async () => {
      vi.mocked(prisma.reptile.update).mockResolvedValue({ ...mockReptile, notes: 'Updated notes' })

      await repository.update('cltest123456789', { notes: 'Updated notes' })

      expect(prisma.reptile.update).toHaveBeenCalledWith({
        where: { id: 'cltest123456789' },
        data: { notes: 'Updated notes' },
      })
    })

    it('should allow setting nullable fields to null', async () => {
      vi.mocked(prisma.reptile.update).mockResolvedValue({ ...mockReptile, notes: null })

      await repository.update('cltest123456789', { notes: null })

      expect(prisma.reptile.update).toHaveBeenCalledWith({
        where: { id: 'cltest123456789' },
        data: { notes: null },
      })
    })
  })

  describe('softDelete', () => {
    it('should soft delete a reptile by setting deletedAt', async () => {
      const deletedReptile = { ...mockReptile, deletedAt: new Date() }
      vi.mocked(prisma.reptile.update).mockResolvedValue(deletedReptile)

      const result = await repository.softDelete('cltest123456789')

      expect(result.deletedAt).not.toBeNull()
      expect(prisma.reptile.update).toHaveBeenCalledWith({
        where: { id: 'cltest123456789' },
        data: { deletedAt: expect.any(Date) },
      })
    })
  })

  describe('restore', () => {
    it('should restore a soft-deleted reptile by clearing deletedAt', async () => {
      const restoredReptile = { ...mockDeletedReptile, deletedAt: null }
      vi.mocked(prisma.reptile.update).mockResolvedValue(restoredReptile)

      const result = await repository.restore('cldeleted123456')

      expect(result.deletedAt).toBeNull()
      expect(prisma.reptile.update).toHaveBeenCalledWith({
        where: { id: 'cldeleted123456' },
        data: { deletedAt: null },
      })
    })
  })
})
