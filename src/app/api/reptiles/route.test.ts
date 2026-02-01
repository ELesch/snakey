// API Route Tests: /api/reptiles - GET (list), POST (create)
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest } from 'next/server'

// Use vi.hoisted for mocks that need to be available during module evaluation
const { mockList, mockCreate, mockGetUserId } = vi.hoisted(() => ({
  mockList: vi.fn(),
  mockCreate: vi.fn(),
  mockGetUserId: vi.fn(),
}))

vi.mock('@/services/reptile.service', () => ({
  ReptileService: vi.fn().mockImplementation(() => ({
    list: mockList,
    create: mockCreate,
  })),
  NotFoundError: class NotFoundError extends Error {
    constructor(message: string) {
      super(message)
      this.name = 'NotFoundError'
    }
  },
  ForbiddenError: class ForbiddenError extends Error {
    constructor(message: string) {
      super(message)
      this.name = 'ForbiddenError'
    }
  },
  ValidationError: class ValidationError extends Error {
    constructor(message: string) {
      super(message)
      this.name = 'ValidationError'
    }
  },
}))

vi.mock('@/lib/supabase/server', () => ({
  getUserId: () => mockGetUserId(),
}))

// Import after mocks are set up
import { GET, POST } from './route'

// Mock the logger
vi.mock('@/lib/logger', () => ({
  createLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  }),
}))

describe('GET /api/reptiles', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  it('should return 401 when user is not authenticated', async () => {
    mockGetUserId.mockResolvedValue(null)

    const request = new NextRequest('http://localhost:3000/api/reptiles')
    const response = await GET(request)
    const body = await response.json()

    expect(response.status).toBe(401)
    expect(body.error.code).toBe('UNAUTHORIZED')
    expect(body.error.message).toBe('Authentication required')
  })

  it('should return paginated reptiles for authenticated user', async () => {
    mockGetUserId.mockResolvedValue('user-123')
    mockList.mockResolvedValue({
      data: [
        { id: '1', name: 'Monty', species: 'Ball Python' },
        { id: '2', name: 'Slither', species: 'Corn Snake' },
      ],
      meta: {
        page: 1,
        limit: 20,
        total: 2,
        totalPages: 1,
        hasNext: false,
        hasPrev: false,
      },
    })

    const request = new NextRequest('http://localhost:3000/api/reptiles')
    const response = await GET(request)
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.data).toHaveLength(2)
    expect(body.meta.total).toBe(2)
    expect(mockList).toHaveBeenCalledWith('user-123', expect.any(Object))
  })

  it('should pass query parameters to the service', async () => {
    mockGetUserId.mockResolvedValue('user-123')
    mockList.mockResolvedValue({
      data: [],
      meta: { page: 2, limit: 10, total: 0, totalPages: 0, hasNext: false, hasPrev: true },
    })

    const request = new NextRequest(
      'http://localhost:3000/api/reptiles?page=2&limit=10&species=Ball%20Python&search=test'
    )
    const response = await GET(request)

    expect(response.status).toBe(200)
    expect(mockList).toHaveBeenCalledWith('user-123', {
      page: 2,
      limit: 10,
      species: 'Ball Python',
      search: 'test',
      sort: 'createdAt',
      order: 'desc',
      includeDeleted: false,
    })
  })

  it('should return 400 for invalid query parameters', async () => {
    mockGetUserId.mockResolvedValue('user-123')

    const request = new NextRequest(
      'http://localhost:3000/api/reptiles?page=invalid'
    )
    const response = await GET(request)
    const body = await response.json()

    expect(response.status).toBe(400)
    expect(body.error.code).toBe('INVALID_QUERY_PARAMS')
  })

  it('should filter by sex when provided', async () => {
    mockGetUserId.mockResolvedValue('user-123')
    mockList.mockResolvedValue({
      data: [],
      meta: { page: 1, limit: 20, total: 0, totalPages: 0, hasNext: false, hasPrev: false },
    })

    const request = new NextRequest(
      'http://localhost:3000/api/reptiles?sex=MALE'
    )
    const response = await GET(request)

    expect(response.status).toBe(200)
    expect(mockList).toHaveBeenCalledWith('user-123', expect.objectContaining({
      sex: 'MALE',
    }))
  })

  it('should handle internal errors with 500 status', async () => {
    mockGetUserId.mockResolvedValue('user-123')
    mockList.mockRejectedValue(new Error('Database connection failed'))

    const request = new NextRequest('http://localhost:3000/api/reptiles')
    const response = await GET(request)
    const body = await response.json()

    expect(response.status).toBe(500)
    expect(body.error.code).toBe('INTERNAL_ERROR')
  })
})

describe('POST /api/reptiles', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  it('should return 401 when user is not authenticated', async () => {
    mockGetUserId.mockResolvedValue(null)

    const request = new NextRequest('http://localhost:3000/api/reptiles', {
      method: 'POST',
      body: JSON.stringify({ name: 'Monty', species: 'Ball Python' }),
    })
    const response = await POST(request)
    const body = await response.json()

    expect(response.status).toBe(401)
    expect(body.error.code).toBe('UNAUTHORIZED')
  })

  it('should create a reptile with valid data', async () => {
    mockGetUserId.mockResolvedValue('user-123')
    const mockReptile = {
      id: 'reptile-1',
      name: 'Monty',
      species: 'Ball Python',
      sex: 'MALE',
      userId: 'user-123',
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    mockCreate.mockResolvedValue(mockReptile)

    const request = new NextRequest('http://localhost:3000/api/reptiles', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Monty',
        species: 'Ball Python',
        sex: 'MALE',
        acquisitionDate: '2024-01-15',
      }),
    })
    const response = await POST(request)
    const body = await response.json()

    expect(response.status).toBe(201)
    expect(body.data.id).toBe('reptile-1')
    expect(body.data.name).toBe('Monty')
    expect(mockCreate).toHaveBeenCalledWith('user-123', expect.objectContaining({
      name: 'Monty',
      species: 'Ball Python',
    }))
  })

  it('should return 400 for validation errors', async () => {
    mockGetUserId.mockResolvedValue('user-123')

    // Import the actual error class to throw it properly
    const { ValidationError } = await import('@/services/reptile.service')
    mockCreate.mockRejectedValue(new ValidationError('Name is required'))

    const request = new NextRequest('http://localhost:3000/api/reptiles', {
      method: 'POST',
      body: JSON.stringify({ species: 'Ball Python' }),
    })
    const response = await POST(request)
    const body = await response.json()

    expect(response.status).toBe(400)
    expect(body.error.code).toBe('VALIDATION_ERROR')
  })

  it('should handle internal errors with 500 status', async () => {
    mockGetUserId.mockResolvedValue('user-123')
    mockCreate.mockRejectedValue(new Error('Database error'))

    const request = new NextRequest('http://localhost:3000/api/reptiles', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Monty',
        species: 'Ball Python',
        acquisitionDate: '2024-01-15',
      }),
    })
    const response = await POST(request)
    const body = await response.json()

    expect(response.status).toBe(500)
    expect(body.error.code).toBe('INTERNAL_ERROR')
  })
})
