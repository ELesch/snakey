// Base Service Tests - Ownership Verification Utilities
import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  verifyReptileOwnership,
  verifyRecordOwnership,
  type RecordRepository,
  type RecordWithReptile,
} from './base.service'
import { NotFoundError, ForbiddenError } from '@/lib/errors'
import { ReptileRepository } from '@/repositories/reptile.repository'

// Mock the repository (must export reptileRepository singleton for base.service)
vi.mock('@/repositories/reptile.repository', () => {
  const instance = {
    findById: vi.fn(),
  }
  return {
    ReptileRepository: vi.fn().mockImplementation(() => instance),
    reptileRepository: instance,
  }
})

// Mock the logger
vi.mock('@/lib/logger', () => ({
  createLogger: vi.fn(() => ({
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
    error: vi.fn(),
  })),
}))

describe('verifyReptileOwnership', () => {
  let mockReptileRepository: { findById: ReturnType<typeof vi.fn> }

  beforeEach(async () => {
    vi.clearAllMocks()

    // Get the mock instance from the module
    const { reptileRepository } = await import('@/repositories/reptile.repository')
    mockReptileRepository = reptileRepository as unknown as typeof mockReptileRepository
  })

  it('should return reptile when user owns it', async () => {
    const userId = 'user-123'
    const reptileId = 'reptile-456'
    const mockReptile = {
      id: reptileId,
      userId,
      name: 'Monty',
      species: 'ball_python',
      deletedAt: null,
    }

    mockReptileRepository.findById.mockResolvedValue(mockReptile)

    const result = await verifyReptileOwnership(reptileId, userId)

    expect(result).toEqual(mockReptile)
    expect(mockReptileRepository.findById).toHaveBeenCalledWith(reptileId)
  })

  it('should throw NotFoundError when reptile does not exist', async () => {
    mockReptileRepository.findById.mockResolvedValue(null)

    await expect(
      verifyReptileOwnership('nonexistent', 'user-123')
    ).rejects.toThrow(NotFoundError)
  })

  it('should throw ForbiddenError when user does not own the reptile', async () => {
    const mockReptile = {
      id: 'reptile-456',
      userId: 'other-user',
      name: 'Monty',
      species: 'ball_python',
      deletedAt: null,
    }

    mockReptileRepository.findById.mockResolvedValue(mockReptile)

    await expect(
      verifyReptileOwnership('reptile-456', 'user-123')
    ).rejects.toThrow(ForbiddenError)
  })

  it('should throw NotFoundError when reptile is soft deleted', async () => {
    const mockReptile = {
      id: 'reptile-456',
      userId: 'user-123',
      name: 'Monty',
      species: 'ball_python',
      deletedAt: new Date(),
    }

    mockReptileRepository.findById.mockResolvedValue(mockReptile)

    await expect(
      verifyReptileOwnership('reptile-456', 'user-123')
    ).rejects.toThrow(NotFoundError)
  })

  it('should allow soft-deleted reptiles when allowDeleted option is true', async () => {
    const userId = 'user-123'
    const reptileId = 'reptile-456'
    const mockReptile = {
      id: reptileId,
      userId,
      name: 'Monty',
      species: 'ball_python',
      deletedAt: new Date(),
    }

    mockReptileRepository.findById.mockResolvedValue(mockReptile)

    const result = await verifyReptileOwnership(reptileId, userId, { allowDeleted: true })

    expect(result).toEqual(mockReptile)
  })

  it('should use custom entity label in error messages', async () => {
    mockReptileRepository.findById.mockResolvedValue(null)

    await expect(
      verifyReptileOwnership('reptile-456', 'user-123', { entityLabel: 'Male' })
    ).rejects.toThrow('Male reptile not found')
  })
})

describe('verifyRecordOwnership', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return record when user owns the associated reptile', async () => {
    const userId = 'user-123'
    const recordId = 'feeding-789'
    const reptileId = 'reptile-456'

    const mockRecord = {
      id: recordId,
      reptileId,
      date: new Date(),
    }

    const mockReptile = {
      id: reptileId,
      userId,
      name: 'Monty',
      species: 'ball_python',
      deletedAt: null,
    }

    // Mock the repository's findById with reptile relation
    const mockRecordRepository: RecordRepository<RecordWithReptile> = {
      findById: vi.fn().mockResolvedValue({
        ...mockRecord,
        reptile: mockReptile,
      }),
    }

    const result = await verifyRecordOwnership(
      mockRecordRepository,
      recordId,
      userId,
      { entityLabel: 'Feeding' }
    )

    expect(result).toMatchObject({ id: recordId, reptileId })
  })

  it('should throw NotFoundError when record does not exist', async () => {
    const mockRecordRepository: RecordRepository<RecordWithReptile> = {
      findById: vi.fn().mockResolvedValue(null),
    }

    await expect(
      verifyRecordOwnership(
        mockRecordRepository,
        'nonexistent',
        'user-123',
        { entityLabel: 'Feeding' }
      )
    ).rejects.toThrow(NotFoundError)
  })

  it('should throw ForbiddenError when user does not own the associated reptile', async () => {
    const mockRecord = {
      id: 'feeding-789',
      reptileId: 'reptile-456',
      reptile: {
        id: 'reptile-456',
        userId: 'other-user',
        name: 'Monty',
        species: 'ball_python',
        deletedAt: null,
      },
    }

    const mockRecordRepository: RecordRepository<RecordWithReptile> = {
      findById: vi.fn().mockResolvedValue(mockRecord),
    }

    await expect(
      verifyRecordOwnership(
        mockRecordRepository,
        'feeding-789',
        'user-123',
        { entityLabel: 'Feeding' }
      )
    ).rejects.toThrow(ForbiddenError)
  })

  it('should throw NotFoundError when record is soft deleted', async () => {
    const mockRecord = {
      id: 'feeding-789',
      reptileId: 'reptile-456',
      deletedAt: new Date(),
      reptile: {
        id: 'reptile-456',
        userId: 'user-123',
        name: 'Monty',
        species: 'ball_python',
        deletedAt: null,
      },
    }

    const mockRecordRepository: RecordRepository<RecordWithReptile> = {
      findById: vi.fn().mockResolvedValue(mockRecord),
    }

    await expect(
      verifyRecordOwnership(
        mockRecordRepository,
        'feeding-789',
        'user-123',
        { entityLabel: 'Photo' }
      )
    ).rejects.toThrow(NotFoundError)
  })

  it('should allow soft-deleted records when allowDeleted option is true', async () => {
    const mockRecord = {
      id: 'photo-789',
      reptileId: 'reptile-456',
      deletedAt: new Date(),
      reptile: {
        id: 'reptile-456',
        userId: 'user-123',
        name: 'Monty',
        species: 'ball_python',
        deletedAt: null,
      },
    }

    const mockRecordRepository: RecordRepository<RecordWithReptile> = {
      findById: vi.fn().mockResolvedValue(mockRecord),
    }

    const result = await verifyRecordOwnership(
      mockRecordRepository,
      'photo-789',
      'user-123',
      { entityLabel: 'Photo', allowDeleted: true }
    )

    expect(result).toMatchObject({ id: 'photo-789' })
  })
})
