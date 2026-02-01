// Environment Service Tests - TDD Red Phase
import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest'
import { EnvironmentService } from './environment.service'
import { EnvironmentRepository } from '@/repositories/environment.repository'
import { ReptileRepository } from '@/repositories/reptile.repository'
import type { Sex } from '@/generated/prisma/client'

// Mock the repositories
vi.mock('@/repositories/environment.repository')

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
    reptile: {
      findUnique: vi.fn(),
    },
  },
}))

// Mock the logger
vi.mock('@/lib/logger', () => ({
  createLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  }),
}))

// Mock environment log type for testing
interface MockEnvironmentLog {
  id: string
  reptileId: string
  date: Date
  temperature: number | null
  humidity: number | null
  location: string | null
  notes: string | null
  isAlert: boolean
  createdAt: Date
}

// Mock reptile for authorization testing
interface MockReptile {
  id: string
  userId: string
  name: string
  species: string
  morph: string | null
  sex: Sex
  birthDate: Date | null
  acquisitionDate: Date
  currentWeight: number | null
  notes: string | null
  isPublic: boolean
  shareId: string | null
  createdAt: Date
  updatedAt: Date
  deletedAt: Date | null
}

const mockReptile: MockReptile = {
  id: 'reptile-123',
  userId: 'user-123',
  name: 'Luna',
  species: 'ball_python',
  morph: 'Banana Pied',
  sex: 'FEMALE' as Sex,
  birthDate: new Date('2022-06-15'),
  acquisitionDate: new Date('2022-09-01'),
  currentWeight: 1250.5,
  notes: 'Great eater',
  isPublic: false,
  shareId: null,
  createdAt: new Date('2022-09-01'),
  updatedAt: new Date('2024-01-15'),
  deletedAt: null,
}

const mockEnvironmentLog: MockEnvironmentLog = {
  id: 'envlog-123',
  reptileId: 'reptile-123',
  date: new Date('2024-01-15T10:00:00Z'),
  temperature: 88.5,
  humidity: 55,
  location: 'hot_side',
  notes: 'Morning reading',
  isAlert: false,
  createdAt: new Date('2024-01-15T10:00:00Z'),
}

const mockAlertLog: MockEnvironmentLog = {
  id: 'envlog-alert',
  reptileId: 'reptile-123',
  date: new Date('2024-01-15T14:00:00Z'),
  temperature: 98, // Too hot for ball python
  humidity: 30, // Too low for ball python
  location: 'hot_side',
  notes: 'Temperature spike detected',
  isAlert: true,
  createdAt: new Date('2024-01-15T14:00:00Z'),
}

describe('EnvironmentService', () => {
  let service: EnvironmentService
  let mockEnvRepository: {
    findMany: Mock
    findById: Mock
    create: Mock
    update: Mock
    delete: Mock
    count: Mock
  }
  let mockReptileRepository: {
    findById: Mock
  }

  beforeEach(async () => {
    vi.clearAllMocks()

    // Get the mock instance from the module (used by base.service)
    const { reptileRepository } = await import('@/repositories/reptile.repository')

    mockEnvRepository = {
      findMany: vi.fn(),
      findById: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    }

    mockReptileRepository = reptileRepository as unknown as typeof mockReptileRepository

    vi.mocked(EnvironmentRepository).mockImplementation(
      () => mockEnvRepository as unknown as EnvironmentRepository
    )

    service = new EnvironmentService()
  })

  describe('list', () => {
    it('should return paginated environment logs for a reptile', async () => {
      mockReptileRepository.findById.mockResolvedValue(mockReptile)
      mockEnvRepository.findMany.mockResolvedValue([mockEnvironmentLog])
      mockEnvRepository.count.mockResolvedValue(1)

      const result = await service.list('user-123', 'reptile-123', { page: 1, limit: 20 })

      expect(result.data).toEqual([mockEnvironmentLog])
      expect(result.meta.page).toBe(1)
      expect(result.meta.limit).toBe(20)
      expect(result.meta.total).toBe(1)
      expect(mockEnvRepository.findMany).toHaveBeenCalledWith({
        reptileId: 'reptile-123',
        skip: 0,
        take: 20,
        orderBy: { date: 'desc' },
        startDate: undefined,
        endDate: undefined,
        location: undefined,
        alertsOnly: false,
      })
    })

    it('should throw ForbiddenError when user does not own reptile', async () => {
      mockReptileRepository.findById.mockResolvedValue(mockReptile)

      await expect(
        service.list('different-user', 'reptile-123', {})
      ).rejects.toThrow('Access denied')
    })

    it('should throw NotFoundError when reptile does not exist', async () => {
      mockReptileRepository.findById.mockResolvedValue(null)

      await expect(
        service.list('user-123', 'nonexistent', {})
      ).rejects.toThrow('Reptile not found')
    })

    it('should filter by date range', async () => {
      mockReptileRepository.findById.mockResolvedValue(mockReptile)
      mockEnvRepository.findMany.mockResolvedValue([mockEnvironmentLog])
      mockEnvRepository.count.mockResolvedValue(1)

      const startDate = new Date('2024-01-01')
      const endDate = new Date('2024-01-31')

      await service.list('user-123', 'reptile-123', { startDate, endDate })

      expect(mockEnvRepository.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          startDate,
          endDate,
        })
      )
    })

    it('should filter by location', async () => {
      mockReptileRepository.findById.mockResolvedValue(mockReptile)
      mockEnvRepository.findMany.mockResolvedValue([mockEnvironmentLog])
      mockEnvRepository.count.mockResolvedValue(1)

      await service.list('user-123', 'reptile-123', { location: 'hot_side' })

      expect(mockEnvRepository.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          location: 'hot_side',
        })
      )
    })

    it('should filter by alerts only', async () => {
      mockReptileRepository.findById.mockResolvedValue(mockReptile)
      mockEnvRepository.findMany.mockResolvedValue([mockAlertLog])
      mockEnvRepository.count.mockResolvedValue(1)

      await service.list('user-123', 'reptile-123', { alertsOnly: true })

      expect(mockEnvRepository.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          alertsOnly: true,
        })
      )
    })
  })

  describe('getById', () => {
    it('should return environment log by id', async () => {
      // verifyRecordOwnership calls findById with includeReptile: true
      mockEnvRepository.findById.mockResolvedValue({
        ...mockEnvironmentLog,
        reptile: mockReptile,
      })

      const result = await service.getById('user-123', 'envlog-123')

      expect(result.id).toBe(mockEnvironmentLog.id)
    })

    it('should throw NotFoundError when log does not exist', async () => {
      mockEnvRepository.findById.mockResolvedValue(null)

      await expect(service.getById('user-123', 'nonexistent')).rejects.toThrow(
        'Environment log not found'
      )
    })

    it('should throw ForbiddenError when user does not own reptile', async () => {
      // verifyRecordOwnership checks ownership via the reptile relation
      mockEnvRepository.findById.mockResolvedValue({
        ...mockEnvironmentLog,
        reptile: { ...mockReptile, userId: 'different-user' },
      })

      await expect(service.getById('user-123', 'envlog-123')).rejects.toThrow(
        'Access denied'
      )
    })
  })

  describe('create', () => {
    it('should create a new environment log', async () => {
      mockReptileRepository.findById.mockResolvedValue(mockReptile)
      mockEnvRepository.create.mockResolvedValue(mockEnvironmentLog)

      const createData = {
        date: new Date('2024-01-15T10:00:00Z'),
        temperature: 88.5,
        humidity: 55,
        location: 'hot_side',
        notes: 'Morning reading',
      }

      const result = await service.create('user-123', 'reptile-123', createData)

      expect(result).toEqual(mockEnvironmentLog)
      expect(mockEnvRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          reptileId: 'reptile-123',
          temperature: 88.5,
          humidity: 55,
          location: 'hot_side',
        })
      )
    })

    it('should throw ForbiddenError when user does not own reptile', async () => {
      mockReptileRepository.findById.mockResolvedValue(mockReptile)

      await expect(
        service.create('different-user', 'reptile-123', {
          date: new Date(),
          temperature: 88,
        })
      ).rejects.toThrow('Access denied')
    })

    it('should throw NotFoundError when reptile does not exist', async () => {
      mockReptileRepository.findById.mockResolvedValue(null)

      await expect(
        service.create('user-123', 'nonexistent', {
          date: new Date(),
          temperature: 88,
        })
      ).rejects.toThrow('Reptile not found')
    })

    it('should validate temperature range (0-150)', async () => {
      mockReptileRepository.findById.mockResolvedValue(mockReptile)

      await expect(
        service.create('user-123', 'reptile-123', {
          date: new Date(),
          temperature: -10, // Invalid
        })
      ).rejects.toThrow()

      await expect(
        service.create('user-123', 'reptile-123', {
          date: new Date(),
          temperature: 200, // Invalid
        })
      ).rejects.toThrow()
    })

    it('should validate humidity range (0-100)', async () => {
      mockReptileRepository.findById.mockResolvedValue(mockReptile)

      await expect(
        service.create('user-123', 'reptile-123', {
          date: new Date(),
          humidity: -5, // Invalid
        })
      ).rejects.toThrow()

      await expect(
        service.create('user-123', 'reptile-123', {
          date: new Date(),
          humidity: 150, // Invalid
        })
      ).rejects.toThrow()
    })

    it('should set isAlert true when readings are out of species range', async () => {
      mockReptileRepository.findById.mockResolvedValue(mockReptile)
      mockEnvRepository.create.mockResolvedValue(mockAlertLog)

      // Temperature 98 is too hot for ball python (max 92)
      await service.create('user-123', 'reptile-123', {
        date: new Date(),
        temperature: 98,
        location: 'hot_side',
      })

      expect(mockEnvRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          isAlert: true,
        })
      )
    })

    it('should set isAlert false when readings are within species range', async () => {
      mockReptileRepository.findById.mockResolvedValue(mockReptile)
      mockEnvRepository.create.mockResolvedValue(mockEnvironmentLog)

      // Temperature 89 is within ball python range (88-92)
      await service.create('user-123', 'reptile-123', {
        date: new Date(),
        temperature: 89,
        location: 'hot_side',
      })

      expect(mockEnvRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          isAlert: false,
        })
      )
    })

    it('should accept client-provided id for offline sync', async () => {
      // Use a valid cuid2-like format (25 chars, lowercase alphanumeric starting with letter)
      const clientId = 'tz4a98xxat96iws9zmbrgj3a4'
      mockReptileRepository.findById.mockResolvedValue(mockReptile)
      mockEnvRepository.create.mockResolvedValue({ ...mockEnvironmentLog, id: clientId })

      await service.create('user-123', 'reptile-123', {
        id: clientId,
        date: new Date(),
        temperature: 88,
      })

      expect(mockEnvRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          id: clientId,
        })
      )
    })
  })

  describe('update', () => {
    it('should update an existing environment log', async () => {
      // verifyRecordOwnership calls findById with includeReptile: true
      mockEnvRepository.findById.mockResolvedValue({
        ...mockEnvironmentLog,
        reptile: mockReptile,
      })
      mockReptileRepository.findById.mockResolvedValue(mockReptile)
      const updatedLog = { ...mockEnvironmentLog, temperature: 90 }
      mockEnvRepository.update.mockResolvedValue(updatedLog)

      const result = await service.update('user-123', 'envlog-123', { temperature: 90 })

      expect(result).toEqual(updatedLog)
      expect(mockEnvRepository.update).toHaveBeenCalledWith(
        'envlog-123',
        expect.objectContaining({ temperature: 90 })
      )
    })

    it('should throw NotFoundError when log does not exist', async () => {
      mockEnvRepository.findById.mockResolvedValue(null)

      await expect(
        service.update('user-123', 'nonexistent', { temperature: 90 })
      ).rejects.toThrow('Environment log not found')
    })

    it('should throw ForbiddenError when user does not own reptile', async () => {
      // verifyRecordOwnership checks ownership via the reptile relation
      mockEnvRepository.findById.mockResolvedValue({
        ...mockEnvironmentLog,
        reptile: { ...mockReptile, userId: 'different-user' },
      })

      await expect(
        service.update('user-123', 'envlog-123', { temperature: 90 })
      ).rejects.toThrow('Access denied')
    })

    it('should validate temperature range on update', async () => {
      mockEnvRepository.findById.mockResolvedValue({
        ...mockEnvironmentLog,
        reptile: mockReptile,
      })
      mockReptileRepository.findById.mockResolvedValue(mockReptile)

      await expect(
        service.update('user-123', 'envlog-123', { temperature: 200 })
      ).rejects.toThrow()
    })

    it('should recalculate isAlert on update', async () => {
      mockEnvRepository.findById.mockResolvedValue({
        ...mockEnvironmentLog,
        reptile: mockReptile,
      })
      mockReptileRepository.findById.mockResolvedValue(mockReptile)
      mockEnvRepository.update.mockResolvedValue({ ...mockEnvironmentLog, temperature: 98, isAlert: true })

      await service.update('user-123', 'envlog-123', { temperature: 98 })

      expect(mockEnvRepository.update).toHaveBeenCalledWith(
        'envlog-123',
        expect.objectContaining({ isAlert: true })
      )
    })
  })

  describe('delete', () => {
    it('should delete an environment log', async () => {
      // verifyRecordOwnership calls findById with includeReptile: true
      mockEnvRepository.findById.mockResolvedValue({
        ...mockEnvironmentLog,
        reptile: mockReptile,
      })
      mockEnvRepository.delete.mockResolvedValue(mockEnvironmentLog)

      const result = await service.delete('user-123', 'envlog-123')

      expect(result).toEqual({ id: 'envlog-123' })
      expect(mockEnvRepository.delete).toHaveBeenCalledWith('envlog-123')
    })

    it('should throw NotFoundError when log does not exist', async () => {
      mockEnvRepository.findById.mockResolvedValue(null)

      await expect(service.delete('user-123', 'nonexistent')).rejects.toThrow(
        'Environment log not found'
      )
    })

    it('should throw ForbiddenError when user does not own reptile', async () => {
      // verifyRecordOwnership checks ownership via the reptile relation
      mockEnvRepository.findById.mockResolvedValue({
        ...mockEnvironmentLog,
        reptile: { ...mockReptile, userId: 'different-user' },
      })

      await expect(service.delete('user-123', 'envlog-123')).rejects.toThrow(
        'Access denied'
      )
    })
  })
})
