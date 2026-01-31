// Sync Service Tests - TDD Red Phase
import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest'
import {
  SyncService,
  type SyncOperation,
  type SyncResult,
  SyncValidationError,
  SyncNotFoundError,
  SyncForbiddenError,
  SyncConflictError,
} from './sync.service'
import { ReptileService } from './reptile.service'
import { FeedingService } from './feeding.service'
import { ShedService } from './shed.service'
import { WeightService } from './weight.service'
import { EnvironmentService } from './environment.service'
import { PhotoService } from './photo.service'
import { ReptileRepository } from '@/repositories/reptile.repository'

// Mock all services
vi.mock('./reptile.service')
vi.mock('./feeding.service')
vi.mock('./shed.service')
vi.mock('./weight.service')
vi.mock('./environment.service')
vi.mock('./photo.service')
vi.mock('@/repositories/reptile.repository')

// Mock the logger
vi.mock('@/lib/logger', () => ({
  createLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  }),
}))

// Mock prisma client
vi.mock('@/lib/db/client', () => ({
  prisma: {
    $transaction: vi.fn((callback: () => Promise<unknown>) => callback()),
    reptile: { findMany: vi.fn(), findUnique: vi.fn() },
    feeding: { findMany: vi.fn() },
    shed: { findMany: vi.fn() },
    weight: { findMany: vi.fn() },
    environmentLog: { findMany: vi.fn() },
    photo: { findMany: vi.fn() },
  },
}))

describe('SyncService', () => {
  let service: SyncService
  let mockReptileService: {
    create: Mock
    update: Mock
    softDelete: Mock
    getById: Mock
  }
  let mockFeedingService: {
    create: Mock
    update: Mock
    delete: Mock
    getById: Mock
  }
  let mockShedService: {
    create: Mock
    update: Mock
    delete: Mock
    getById: Mock
  }
  let mockWeightService: {
    create: Mock
    update: Mock
    delete: Mock
    getById: Mock
  }
  let mockEnvironmentService: {
    create: Mock
    update: Mock
    delete: Mock
    getById: Mock
  }
  let mockPhotoService: {
    create: Mock
    update: Mock
    delete: Mock
    getById: Mock
  }
  let mockReptileRepository: {
    findById: Mock
  }

  const mockUserId = 'user-123'
  const mockReptileId = 'reptile-456'
  const mockRecordId = 'record-789'

  beforeEach(() => {
    vi.clearAllMocks()

    // Setup service mocks
    mockReptileService = {
      create: vi.fn(),
      update: vi.fn(),
      softDelete: vi.fn(),
      getById: vi.fn(),
    }
    mockFeedingService = {
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      getById: vi.fn(),
    }
    mockShedService = {
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      getById: vi.fn(),
    }
    mockWeightService = {
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      getById: vi.fn(),
    }
    mockEnvironmentService = {
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      getById: vi.fn(),
    }
    mockPhotoService = {
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      getById: vi.fn(),
    }
    mockReptileRepository = {
      findById: vi.fn(),
    }

    vi.mocked(ReptileService).mockImplementation(
      () => mockReptileService as unknown as ReptileService
    )
    vi.mocked(FeedingService).mockImplementation(
      () => mockFeedingService as unknown as FeedingService
    )
    vi.mocked(ShedService).mockImplementation(
      () => mockShedService as unknown as ShedService
    )
    vi.mocked(WeightService).mockImplementation(
      () => mockWeightService as unknown as WeightService
    )
    vi.mocked(EnvironmentService).mockImplementation(
      () => mockEnvironmentService as unknown as EnvironmentService
    )
    vi.mocked(PhotoService).mockImplementation(
      () => mockPhotoService as unknown as PhotoService
    )
    vi.mocked(ReptileRepository).mockImplementation(
      () => mockReptileRepository as unknown as ReptileRepository
    )

    service = new SyncService()
  })

  describe('processSyncOperation', () => {
    describe('reptiles table', () => {
      it('should process CREATE operation for reptiles', async () => {
        const payload = {
          id: mockRecordId,
          name: 'Luna',
          species: 'ball_python',
          acquisitionDate: new Date('2023-01-01'),
        }
        const createdReptile = { ...payload, userId: mockUserId }
        mockReptileService.create.mockResolvedValue(createdReptile)

        const operation: SyncOperation = {
          operation: 'CREATE',
          recordId: mockRecordId,
          payload,
          clientTimestamp: Date.now(),
        }

        const result = await service.processSyncOperation(
          mockUserId,
          'reptiles',
          operation
        )

        expect(result.success).toBe(true)
        expect(result.recordId).toBe(mockRecordId)
        expect(result.record).toEqual(createdReptile)
        expect(mockReptileService.create).toHaveBeenCalledWith(mockUserId, payload)
      })

      it('should process UPDATE operation for reptiles', async () => {
        const payload = { name: 'Luna Updated' }
        const serverTimestamp = Date.now() - 10000 // Server record is 10 seconds old
        const existingReptile = {
          id: mockRecordId,
          userId: mockUserId,
          name: 'Luna',
          updatedAt: new Date(serverTimestamp),
        }
        const updatedReptile = { ...existingReptile, name: 'Luna Updated' }

        mockReptileService.getById.mockResolvedValue(existingReptile)
        mockReptileService.update.mockResolvedValue(updatedReptile)

        const operation: SyncOperation = {
          operation: 'UPDATE',
          recordId: mockRecordId,
          payload,
          clientTimestamp: Date.now(), // Client timestamp is newer
        }

        const result = await service.processSyncOperation(
          mockUserId,
          'reptiles',
          operation
        )

        expect(result.success).toBe(true)
        expect(mockReptileService.update).toHaveBeenCalledWith(
          mockUserId,
          mockRecordId,
          payload
        )
      })

      it('should process DELETE operation for reptiles', async () => {
        const deletedAt = new Date()
        mockReptileService.softDelete.mockResolvedValue({
          id: mockRecordId,
          deletedAt,
        })

        const operation: SyncOperation = {
          operation: 'DELETE',
          recordId: mockRecordId,
          payload: null,
          clientTimestamp: Date.now(),
        }

        const result = await service.processSyncOperation(
          mockUserId,
          'reptiles',
          operation
        )

        expect(result.success).toBe(true)
        expect(mockReptileService.softDelete).toHaveBeenCalledWith(
          mockUserId,
          mockRecordId
        )
      })
    })

    describe('feedings table', () => {
      it('should process CREATE operation for feedings', async () => {
        const payload = {
          id: mockRecordId,
          reptileId: mockReptileId,
          date: new Date('2023-06-15'),
          preyType: 'mouse',
          preySize: 'small',
          preySource: 'FROZEN_THAWED',
          accepted: true,
          refused: false,
          regurgitated: false,
        }
        const createdFeeding = { ...payload }
        mockFeedingService.create.mockResolvedValue(createdFeeding)

        const operation: SyncOperation = {
          operation: 'CREATE',
          recordId: mockRecordId,
          payload,
          clientTimestamp: Date.now(),
        }

        const result = await service.processSyncOperation(
          mockUserId,
          'feedings',
          operation
        )

        expect(result.success).toBe(true)
        expect(mockFeedingService.create).toHaveBeenCalledWith(
          mockUserId,
          mockReptileId,
          payload
        )
      })

      it('should process UPDATE operation for feedings', async () => {
        const payload = { notes: 'Updated feeding note', reptileId: mockReptileId }
        const existingFeeding = {
          id: mockRecordId,
          reptileId: mockReptileId,
          updatedAt: new Date(Date.now() - 10000),
        }
        mockFeedingService.getById.mockResolvedValue(existingFeeding)
        mockFeedingService.update.mockResolvedValue({ ...existingFeeding, ...payload })

        const operation: SyncOperation = {
          operation: 'UPDATE',
          recordId: mockRecordId,
          payload,
          clientTimestamp: Date.now(),
        }

        const result = await service.processSyncOperation(
          mockUserId,
          'feedings',
          operation
        )

        expect(result.success).toBe(true)
        expect(mockFeedingService.update).toHaveBeenCalledWith(
          mockUserId,
          mockRecordId,
          payload
        )
      })

      it('should process DELETE operation for feedings', async () => {
        mockFeedingService.delete.mockResolvedValue({ id: mockRecordId })

        const operation: SyncOperation = {
          operation: 'DELETE',
          recordId: mockRecordId,
          payload: null,
          clientTimestamp: Date.now(),
        }

        const result = await service.processSyncOperation(
          mockUserId,
          'feedings',
          operation
        )

        expect(result.success).toBe(true)
        expect(mockFeedingService.delete).toHaveBeenCalledWith(
          mockUserId,
          mockRecordId
        )
      })
    })

    describe('conflict detection', () => {
      it('should detect conflict when server record is newer (last-write-wins)', async () => {
        const serverTimestamp = Date.now() // Server record is current
        const clientTimestamp = Date.now() - 60000 // Client timestamp is 1 minute old

        const existingReptile = {
          id: mockRecordId,
          userId: mockUserId,
          name: 'Server Updated Name',
          updatedAt: new Date(serverTimestamp),
        }

        mockReptileService.getById.mockResolvedValue(existingReptile)

        const operation: SyncOperation = {
          operation: 'UPDATE',
          recordId: mockRecordId,
          payload: { name: 'Client Updated Name' },
          clientTimestamp,
        }

        const result = await service.processSyncOperation(
          mockUserId,
          'reptiles',
          operation
        )

        // Server wins - operation should be skipped (conflict)
        expect(result.success).toBe(false)
        expect(result.conflict).toBe(true)
        expect(result.serverRecord).toEqual(existingReptile)
        expect(mockReptileService.update).not.toHaveBeenCalled()
      })

      it('should apply update when client timestamp is newer', async () => {
        const serverTimestamp = Date.now() - 60000 // Server record is 1 minute old
        const clientTimestamp = Date.now() // Client timestamp is current

        const existingReptile = {
          id: mockRecordId,
          userId: mockUserId,
          name: 'Old Name',
          updatedAt: new Date(serverTimestamp),
        }
        const updatedReptile = { ...existingReptile, name: 'Client Updated Name' }

        mockReptileService.getById.mockResolvedValue(existingReptile)
        mockReptileService.update.mockResolvedValue(updatedReptile)

        const operation: SyncOperation = {
          operation: 'UPDATE',
          recordId: mockRecordId,
          payload: { name: 'Client Updated Name' },
          clientTimestamp,
        }

        const result = await service.processSyncOperation(
          mockUserId,
          'reptiles',
          operation
        )

        expect(result.success).toBe(true)
        expect(result.conflict).toBeFalsy()
        expect(mockReptileService.update).toHaveBeenCalled()
      })
    })

    describe('error handling', () => {
      // Helper to create errors with proper name property
      const createError = (name: string, message: string): Error => {
        const error = new Error(message)
        error.name = name
        return error
      }

      it('should return validation error for invalid payload', async () => {
        mockReptileService.create.mockRejectedValue(
          createError('ValidationError', 'Name is required')
        )

        const operation: SyncOperation = {
          operation: 'CREATE',
          recordId: mockRecordId,
          payload: { species: 'ball_python' }, // Missing name
          clientTimestamp: Date.now(),
        }

        const result = await service.processSyncOperation(
          mockUserId,
          'reptiles',
          operation
        )

        expect(result.success).toBe(false)
        expect(result.error).toBe('Name is required')
        expect(result.errorType).toBe('VALIDATION_ERROR')
      })

      it('should return not found error when record does not exist', async () => {
        // For UPDATE, getById is called for conflict check, then update is called
        // The conflict check catches the error and returns null, so update is called
        // We need to mock getById to return null so conflict check passes,
        // then mock update to throw NotFoundError
        mockReptileService.getById.mockResolvedValue(null)
        mockReptileService.update.mockRejectedValue(
          createError('NotFoundError', 'Reptile not found')
        )

        const operation: SyncOperation = {
          operation: 'UPDATE',
          recordId: 'nonexistent-id',
          payload: { name: 'Updated' },
          clientTimestamp: Date.now(),
        }

        const result = await service.processSyncOperation(
          mockUserId,
          'reptiles',
          operation
        )

        expect(result.success).toBe(false)
        expect(result.error).toBe('Reptile not found')
        expect(result.errorType).toBe('NOT_FOUND')
      })

      it('should return forbidden error when user lacks access', async () => {
        // For UPDATE, we need to pass conflict check first
        mockReptileService.getById.mockResolvedValue(null)
        mockReptileService.update.mockRejectedValue(
          createError('ForbiddenError', 'Access denied')
        )

        const operation: SyncOperation = {
          operation: 'UPDATE',
          recordId: mockRecordId,
          payload: { name: 'Updated' },
          clientTimestamp: Date.now(),
        }

        const result = await service.processSyncOperation(
          mockUserId,
          'reptiles',
          operation
        )

        expect(result.success).toBe(false)
        expect(result.error).toBe('Access denied')
        expect(result.errorType).toBe('FORBIDDEN')
      })

      it('should throw error for unsupported table', async () => {
        const operation: SyncOperation = {
          operation: 'CREATE',
          recordId: mockRecordId,
          payload: {},
          clientTimestamp: Date.now(),
        }

        await expect(
          service.processSyncOperation(mockUserId, 'unsupported_table', operation)
        ).rejects.toThrow('Unsupported table: unsupported_table')
      })
    })

    describe('other tables', () => {
      it('should process CREATE operation for sheds', async () => {
        const payload = {
          id: mockRecordId,
          reptileId: mockReptileId,
          completedDate: new Date('2023-06-15'),
          quality: 'COMPLETE',
          isComplete: true,
        }
        mockShedService.create.mockResolvedValue({ ...payload })

        const operation: SyncOperation = {
          operation: 'CREATE',
          recordId: mockRecordId,
          payload,
          clientTimestamp: Date.now(),
        }

        const result = await service.processSyncOperation(
          mockUserId,
          'sheds',
          operation
        )

        expect(result.success).toBe(true)
        expect(mockShedService.create).toHaveBeenCalledWith(
          mockUserId,
          mockReptileId,
          payload
        )
      })

      it('should process CREATE operation for weights', async () => {
        const payload = {
          id: mockRecordId,
          reptileId: mockReptileId,
          date: new Date('2023-06-15'),
          weight: 250.5,
        }
        mockWeightService.create.mockResolvedValue({ ...payload })

        const operation: SyncOperation = {
          operation: 'CREATE',
          recordId: mockRecordId,
          payload,
          clientTimestamp: Date.now(),
        }

        const result = await service.processSyncOperation(
          mockUserId,
          'weights',
          operation
        )

        expect(result.success).toBe(true)
        expect(mockWeightService.create).toHaveBeenCalledWith(
          mockUserId,
          mockReptileId,
          payload
        )
      })

      it('should process CREATE operation for environmentLogs', async () => {
        const payload = {
          id: mockRecordId,
          reptileId: mockReptileId,
          date: new Date('2023-06-15'),
          temperature: 85.5,
          humidity: 60,
        }
        mockEnvironmentService.create.mockResolvedValue({ ...payload })

        const operation: SyncOperation = {
          operation: 'CREATE',
          recordId: mockRecordId,
          payload,
          clientTimestamp: Date.now(),
        }

        const result = await service.processSyncOperation(
          mockUserId,
          'environmentLogs',
          operation
        )

        expect(result.success).toBe(true)
        expect(mockEnvironmentService.create).toHaveBeenCalledWith(
          mockUserId,
          mockReptileId,
          payload
        )
      })

      it('should process CREATE operation for photos', async () => {
        const payload = {
          id: mockRecordId,
          reptileId: mockReptileId,
          storagePath: 'user-123/photos/image.jpg',
          takenAt: new Date('2023-06-15'),
          category: 'GENERAL',
        }
        mockPhotoService.create.mockResolvedValue({ ...payload })

        const operation: SyncOperation = {
          operation: 'CREATE',
          recordId: mockRecordId,
          payload,
          clientTimestamp: Date.now(),
        }

        const result = await service.processSyncOperation(
          mockUserId,
          'photos',
          operation
        )

        expect(result.success).toBe(true)
        expect(mockPhotoService.create).toHaveBeenCalledWith(
          mockUserId,
          mockReptileId,
          payload
        )
      })
    })
  })

  describe('processBatchSync', () => {
    it('should process multiple operations and return results', async () => {
      const reptilePayload = {
        id: 'reptile-new',
        name: 'Luna',
        species: 'ball_python',
        acquisitionDate: new Date('2023-01-01'),
      }
      const feedingPayload = {
        id: 'feeding-new',
        reptileId: mockReptileId,
        date: new Date('2023-06-15'),
        preyType: 'mouse',
        preySize: 'small',
        preySource: 'FROZEN_THAWED',
        accepted: true,
        refused: false,
        regurgitated: false,
      }

      mockReptileService.create.mockResolvedValue({
        ...reptilePayload,
        userId: mockUserId,
      })
      mockFeedingService.create.mockResolvedValue({
        ...feedingPayload,
      })

      const operations = [
        {
          table: 'reptiles',
          operation: {
            operation: 'CREATE' as const,
            recordId: 'reptile-new',
            payload: reptilePayload,
            clientTimestamp: Date.now(),
          },
        },
        {
          table: 'feedings',
          operation: {
            operation: 'CREATE' as const,
            recordId: 'feeding-new',
            payload: feedingPayload,
            clientTimestamp: Date.now(),
          },
        },
      ]

      const results = await service.processBatchSync(mockUserId, operations)

      expect(results).toHaveLength(2)
      expect(results[0].success).toBe(true)
      expect(results[0].recordId).toBe('reptile-new')
      expect(results[1].success).toBe(true)
      expect(results[1].recordId).toBe('feeding-new')
    })

    it('should continue processing after individual operation failures', async () => {
      // Helper to create errors with proper name property
      const createError = (name: string, message: string): Error => {
        const error = new Error(message)
        error.name = name
        return error
      }

      mockReptileService.create.mockRejectedValue(
        createError('ValidationError', 'Validation failed')
      )
      mockFeedingService.create.mockResolvedValue({
        id: 'feeding-new',
        reptileId: mockReptileId,
      })

      const operations = [
        {
          table: 'reptiles',
          operation: {
            operation: 'CREATE' as const,
            recordId: 'reptile-bad',
            payload: { invalid: true },
            clientTimestamp: Date.now(),
          },
        },
        {
          table: 'feedings',
          operation: {
            operation: 'CREATE' as const,
            recordId: 'feeding-new',
            payload: {
              reptileId: mockReptileId,
              date: new Date(),
              preyType: 'mouse',
              preySize: 'small',
              preySource: 'FROZEN_THAWED',
              accepted: true,
              refused: false,
              regurgitated: false,
            },
            clientTimestamp: Date.now(),
          },
        },
      ]

      const results = await service.processBatchSync(mockUserId, operations)

      expect(results).toHaveLength(2)
      expect(results[0].success).toBe(false)
      expect(results[0].errorType).toBe('VALIDATION_ERROR')
      expect(results[1].success).toBe(true)
    })

    it('should return empty array for empty operations', async () => {
      const results = await service.processBatchSync(mockUserId, [])

      expect(results).toEqual([])
    })
  })

  describe('getChangesSince', () => {
    it('should return changes for all tables since given timestamp', async () => {
      const sinceTimestamp = new Date(Date.now() - 3600000) // 1 hour ago

      // Setup mock repository to return reptiles
      mockReptileRepository.findById.mockResolvedValue({
        id: mockReptileId,
        userId: mockUserId,
      })

      const mockPrisma = await import('@/lib/db/client')
      const prisma = mockPrisma.prisma as unknown as {
        reptile: { findMany: Mock }
        feeding: { findMany: Mock }
        shed: { findMany: Mock }
        weight: { findMany: Mock }
        environmentLog: { findMany: Mock }
        photo: { findMany: Mock }
      }

      const mockReptiles = [
        { id: 'reptile-1', name: 'Luna', updatedAt: new Date() },
      ]
      const mockFeedings = [
        { id: 'feeding-1', reptileId: mockReptileId, updatedAt: new Date() },
      ]

      prisma.reptile.findMany.mockResolvedValue(mockReptiles)
      prisma.feeding.findMany.mockResolvedValue(mockFeedings)
      prisma.shed.findMany.mockResolvedValue([])
      prisma.weight.findMany.mockResolvedValue([])
      prisma.environmentLog.findMany.mockResolvedValue([])
      prisma.photo.findMany.mockResolvedValue([])

      const changes = await service.getChangesSince(mockUserId, sinceTimestamp)

      expect(changes.reptiles).toEqual(mockReptiles)
      expect(changes.feedings).toEqual(mockFeedings)
      expect(changes.sheds).toEqual([])
      expect(changes.weights).toEqual([])
      expect(changes.environmentLogs).toEqual([])
      expect(changes.photos).toEqual([])
      expect(changes.serverTimestamp).toBeDefined()
    })
  })
})
