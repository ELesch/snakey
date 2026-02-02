// API Route Tests: /api/reptiles/[id] - GET, PUT, DELETE
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest } from 'next/server'

// Use vi.hoisted for mocks that need to be available during module evaluation
// All mock classes and fns must be in hoisted block since vi.mock is hoisted
const {
  mockGetById,
  mockUpdate,
  mockSoftDelete,
  mockGetUserId,
  MockNotFoundError,
  MockForbiddenError,
  MockValidationError,
  MockStorageError,
  MockSyncValidationError,
  MockSyncNotFoundError,
  MockSyncForbiddenError,
  MockSyncConflictError,
} = vi.hoisted(() => {
  // Custom error classes for mocking - shared between service and lib/errors mocks
  const MockNotFoundError = class NotFoundError extends Error {
    constructor(message: string) {
      super(message)
      this.name = 'NotFoundError'
    }
  }
  const MockForbiddenError = class ForbiddenError extends Error {
    constructor(message: string) {
      super(message)
      this.name = 'ForbiddenError'
    }
  }
  const MockValidationError = class ValidationError extends Error {
    public readonly fieldErrors?: Record<string, string[]>
    constructor(message: string, fieldErrors?: Record<string, string[]>) {
      super(message)
      this.name = 'ValidationError'
      this.fieldErrors = fieldErrors
    }
  }
  const MockStorageError = class StorageError extends Error {
    constructor(message: string) {
      super(message)
      this.name = 'StorageError'
    }
  }
  const MockSyncValidationError = class SyncValidationError extends Error {
    constructor(message: string) {
      super(message)
      this.name = 'SyncValidationError'
    }
  }
  const MockSyncNotFoundError = class SyncNotFoundError extends Error {
    constructor(message: string) {
      super(message)
      this.name = 'SyncNotFoundError'
    }
  }
  const MockSyncForbiddenError = class SyncForbiddenError extends Error {
    constructor(message: string) {
      super(message)
      this.name = 'SyncForbiddenError'
    }
  }
  const MockSyncConflictError = class SyncConflictError extends Error {
    constructor(message: string) {
      super(message)
      this.name = 'SyncConflictError'
    }
  }

  return {
    mockGetById: vi.fn(),
    mockUpdate: vi.fn(),
    mockSoftDelete: vi.fn(),
    mockGetUserId: vi.fn(),
    MockNotFoundError,
    MockForbiddenError,
    MockValidationError,
    MockStorageError,
    MockSyncValidationError,
    MockSyncNotFoundError,
    MockSyncForbiddenError,
    MockSyncConflictError,
  }
})

vi.mock('@/services/reptile.service', () => ({
  ReptileService: vi.fn().mockImplementation(() => ({
    getById: mockGetById,
    update: mockUpdate,
    softDelete: mockSoftDelete,
  })),
  NotFoundError: MockNotFoundError,
  ForbiddenError: MockForbiddenError,
  ValidationError: MockValidationError,
}))

// Mock @/lib/errors with the SAME classes so instanceof checks work in withErrorHandler
vi.mock('@/lib/errors', () => ({
  NotFoundError: MockNotFoundError,
  ForbiddenError: MockForbiddenError,
  ValidationError: MockValidationError,
  StorageError: MockStorageError,
  SyncValidationError: MockSyncValidationError,
  SyncNotFoundError: MockSyncNotFoundError,
  SyncForbiddenError: MockSyncForbiddenError,
  SyncConflictError: MockSyncConflictError,
}))

vi.mock('@/lib/supabase/server', () => ({
  getUserId: () => mockGetUserId(),
}))

// Import after mocks are set up
import { GET, PUT, DELETE } from './route'

// Mock the logger
vi.mock('@/lib/logger', () => ({
  createLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  }),
}))

// Helper to create route context
const createRouteContext = (id: string) => ({
  params: Promise.resolve({ id }),
})

describe('GET /api/reptiles/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  it('should return 401 when user is not authenticated', async () => {
    mockGetUserId.mockResolvedValue(null)

    const request = new NextRequest('http://localhost:3000/api/reptiles/reptile-1')
    const response = await GET(request, createRouteContext('reptile-1'))
    const body = await response.json()

    expect(response.status).toBe(401)
    expect(body.error.code).toBe('UNAUTHORIZED')
    expect(body.error.message).toBe('Authentication required')
  })

  it('should return a single reptile for authenticated user', async () => {
    mockGetUserId.mockResolvedValue('user-123')
    const mockReptile = {
      id: 'reptile-1',
      name: 'Monty',
      species: 'Ball Python',
      sex: 'MALE',
      userId: 'user-123',
    }
    mockGetById.mockResolvedValue(mockReptile)

    const request = new NextRequest('http://localhost:3000/api/reptiles/reptile-1')
    const response = await GET(request, createRouteContext('reptile-1'))
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.data.id).toBe('reptile-1')
    expect(body.data.name).toBe('Monty')
    expect(mockGetById).toHaveBeenCalledWith('user-123', 'reptile-1', expect.any(Object))
  })

  it('should return 404 when reptile is not found', async () => {
    mockGetUserId.mockResolvedValue('user-123')

    const { NotFoundError } = await import('@/services/reptile.service')
    mockGetById.mockRejectedValue(new NotFoundError('Reptile not found'))

    const request = new NextRequest('http://localhost:3000/api/reptiles/nonexistent')
    const response = await GET(request, createRouteContext('nonexistent'))
    const body = await response.json()

    expect(response.status).toBe(404)
    expect(body.error.code).toBe('NOT_FOUND')
    expect(body.error.message).toBe('Reptile not found')
  })

  it('should return 403 when user does not own the reptile', async () => {
    mockGetUserId.mockResolvedValue('user-123')

    const { ForbiddenError } = await import('@/services/reptile.service')
    mockGetById.mockRejectedValue(new ForbiddenError('Access denied'))

    const request = new NextRequest('http://localhost:3000/api/reptiles/other-user-reptile')
    const response = await GET(request, createRouteContext('other-user-reptile'))
    const body = await response.json()

    expect(response.status).toBe(403)
    expect(body.error.code).toBe('FORBIDDEN')
    expect(body.error.message).toBe('Access denied')
  })

  it('should include related data when requested', async () => {
    mockGetUserId.mockResolvedValue('user-123')
    const mockReptile = {
      id: 'reptile-1',
      name: 'Monty',
      feedings: [{ id: 'feeding-1' }],
      sheds: [{ id: 'shed-1' }],
    }
    mockGetById.mockResolvedValue(mockReptile)

    const request = new NextRequest(
      'http://localhost:3000/api/reptiles/reptile-1?include=feedings,sheds'
    )
    const response = await GET(request, createRouteContext('reptile-1'))
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.data.feedings).toBeDefined()
    expect(body.data.sheds).toBeDefined()
    expect(mockGetById).toHaveBeenCalledWith(
      'user-123',
      'reptile-1',
      expect.objectContaining({
        include: expect.any(Object),
      })
    )
  })

  it('should return 400 for invalid query parameters', async () => {
    mockGetUserId.mockResolvedValue('user-123')

    const request = new NextRequest(
      'http://localhost:3000/api/reptiles/reptile-1?include=invalid_include'
    )
    const response = await GET(request, createRouteContext('reptile-1'))
    const body = await response.json()

    expect(response.status).toBe(400)
    expect(body.error.code).toBe('INVALID_QUERY_PARAMS')
  })

  it('should allow public access with shareId', async () => {
    mockGetUserId.mockResolvedValue('user-123')
    const mockReptile = {
      id: 'reptile-1',
      name: 'Monty',
      isPublic: true,
      shareId: 'share-abc123',
    }
    mockGetById.mockResolvedValue(mockReptile)

    const request = new NextRequest(
      'http://localhost:3000/api/reptiles/reptile-1?shareId=share-abc123'
    )
    const response = await GET(request, createRouteContext('reptile-1'))
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(mockGetById).toHaveBeenCalledWith(
      'user-123',
      'reptile-1',
      expect.objectContaining({
        shareId: 'share-abc123',
      })
    )
  })
})

describe('PUT /api/reptiles/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  it('should return 401 when user is not authenticated', async () => {
    mockGetUserId.mockResolvedValue(null)

    const request = new NextRequest('http://localhost:3000/api/reptiles/reptile-1', {
      method: 'PUT',
      body: JSON.stringify({ name: 'Updated Name' }),
    })
    const response = await PUT(request, createRouteContext('reptile-1'))
    const body = await response.json()

    expect(response.status).toBe(401)
    expect(body.error.code).toBe('UNAUTHORIZED')
  })

  it('should update a reptile with valid data', async () => {
    mockGetUserId.mockResolvedValue('user-123')
    const mockReptile = {
      id: 'reptile-1',
      name: 'Updated Name',
      species: 'Ball Python',
      userId: 'user-123',
    }
    mockUpdate.mockResolvedValue(mockReptile)

    const request = new NextRequest('http://localhost:3000/api/reptiles/reptile-1', {
      method: 'PUT',
      body: JSON.stringify({ name: 'Updated Name' }),
    })
    const response = await PUT(request, createRouteContext('reptile-1'))
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.data.name).toBe('Updated Name')
    expect(mockUpdate).toHaveBeenCalledWith('user-123', 'reptile-1', { name: 'Updated Name' })
  })

  it('should return 404 when reptile is not found', async () => {
    mockGetUserId.mockResolvedValue('user-123')

    const { NotFoundError } = await import('@/services/reptile.service')
    mockUpdate.mockRejectedValue(new NotFoundError('Reptile not found'))

    const request = new NextRequest('http://localhost:3000/api/reptiles/nonexistent', {
      method: 'PUT',
      body: JSON.stringify({ name: 'Updated Name' }),
    })
    const response = await PUT(request, createRouteContext('nonexistent'))
    const body = await response.json()

    expect(response.status).toBe(404)
    expect(body.error.code).toBe('NOT_FOUND')
  })

  it('should return 403 when user does not own the reptile', async () => {
    mockGetUserId.mockResolvedValue('user-123')

    const { ForbiddenError } = await import('@/services/reptile.service')
    mockUpdate.mockRejectedValue(new ForbiddenError('Access denied'))

    const request = new NextRequest('http://localhost:3000/api/reptiles/other-user-reptile', {
      method: 'PUT',
      body: JSON.stringify({ name: 'Updated Name' }),
    })
    const response = await PUT(request, createRouteContext('other-user-reptile'))
    const body = await response.json()

    expect(response.status).toBe(403)
    expect(body.error.code).toBe('FORBIDDEN')
  })

  it('should return 400 for validation errors', async () => {
    mockGetUserId.mockResolvedValue('user-123')

    const { ValidationError } = await import('@/services/reptile.service')
    mockUpdate.mockRejectedValue(new ValidationError('Name is too long'))

    const request = new NextRequest('http://localhost:3000/api/reptiles/reptile-1', {
      method: 'PUT',
      body: JSON.stringify({ name: 'x'.repeat(200) }),
    })
    const response = await PUT(request, createRouteContext('reptile-1'))
    const body = await response.json()

    expect(response.status).toBe(400)
    expect(body.error.code).toBe('VALIDATION_ERROR')
  })

  it('should handle internal errors with 500 status', async () => {
    mockGetUserId.mockResolvedValue('user-123')
    mockUpdate.mockRejectedValue(new Error('Database error'))

    const request = new NextRequest('http://localhost:3000/api/reptiles/reptile-1', {
      method: 'PUT',
      body: JSON.stringify({ name: 'Updated Name' }),
    })
    const response = await PUT(request, createRouteContext('reptile-1'))
    const body = await response.json()

    expect(response.status).toBe(500)
    expect(body.error.code).toBe('INTERNAL_ERROR')
  })
})

describe('DELETE /api/reptiles/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  it('should return 401 when user is not authenticated', async () => {
    mockGetUserId.mockResolvedValue(null)

    const request = new NextRequest('http://localhost:3000/api/reptiles/reptile-1', {
      method: 'DELETE',
    })
    const response = await DELETE(request, createRouteContext('reptile-1'))
    const body = await response.json()

    expect(response.status).toBe(401)
    expect(body.error.code).toBe('UNAUTHORIZED')
  })

  it('should soft delete a reptile', async () => {
    mockGetUserId.mockResolvedValue('user-123')
    const deletedAt = new Date()
    mockSoftDelete.mockResolvedValue({ id: 'reptile-1', deletedAt })

    const request = new NextRequest('http://localhost:3000/api/reptiles/reptile-1', {
      method: 'DELETE',
    })
    const response = await DELETE(request, createRouteContext('reptile-1'))
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.data.id).toBe('reptile-1')
    expect(body.data.deletedAt).toBeDefined()
    expect(mockSoftDelete).toHaveBeenCalledWith('user-123', 'reptile-1')
  })

  it('should return 404 when reptile is not found', async () => {
    mockGetUserId.mockResolvedValue('user-123')

    const { NotFoundError } = await import('@/services/reptile.service')
    mockSoftDelete.mockRejectedValue(new NotFoundError('Reptile not found'))

    const request = new NextRequest('http://localhost:3000/api/reptiles/nonexistent', {
      method: 'DELETE',
    })
    const response = await DELETE(request, createRouteContext('nonexistent'))
    const body = await response.json()

    expect(response.status).toBe(404)
    expect(body.error.code).toBe('NOT_FOUND')
  })

  it('should return 403 when user does not own the reptile', async () => {
    mockGetUserId.mockResolvedValue('user-123')

    const { ForbiddenError } = await import('@/services/reptile.service')
    mockSoftDelete.mockRejectedValue(new ForbiddenError('Access denied'))

    const request = new NextRequest('http://localhost:3000/api/reptiles/other-user-reptile', {
      method: 'DELETE',
    })
    const response = await DELETE(request, createRouteContext('other-user-reptile'))
    const body = await response.json()

    expect(response.status).toBe(403)
    expect(body.error.code).toBe('FORBIDDEN')
  })

  it('should handle internal errors with 500 status', async () => {
    mockGetUserId.mockResolvedValue('user-123')
    mockSoftDelete.mockRejectedValue(new Error('Database error'))

    const request = new NextRequest('http://localhost:3000/api/reptiles/reptile-1', {
      method: 'DELETE',
    })
    const response = await DELETE(request, createRouteContext('reptile-1'))
    const body = await response.json()

    expect(response.status).toBe(500)
    expect(body.error.code).toBe('INTERNAL_ERROR')
  })
})
