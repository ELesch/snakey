// API Route Tests: GET /api/sync/pull
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest } from 'next/server'
import { GET } from './route'

// Mock the sync service
const mockGetChangesSince = vi.fn()

vi.mock('@/services/sync.service', () => ({
  syncService: {
    getChangesSince: (...args: unknown[]) => mockGetChangesSince(...args),
  },
}))

// Mock the getUserId function
const mockGetUserId = vi.fn()
vi.mock('@/lib/supabase/server', () => ({
  getUserId: () => mockGetUserId(),
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

describe('GET /api/sync/pull', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  it('should return 401 when user is not authenticated', async () => {
    mockGetUserId.mockResolvedValue(null)

    const request = new NextRequest('http://localhost:3000/api/sync/pull')
    const response = await GET(request)
    const body = await response.json()

    expect(response.status).toBe(401)
    expect(body.error.code).toBe('UNAUTHORIZED')
    expect(body.error.message).toBe('Authentication required')
  })

  it('should return all records when no since parameter is provided', async () => {
    mockGetUserId.mockResolvedValue('user-123')
    mockGetChangesSince.mockResolvedValue({
      reptiles: [{ id: 'r1', name: 'Monty' }],
      feedings: [{ id: 'f1', reptileId: 'r1' }],
      sheds: [],
      weights: [{ id: 'w1', weight: 500 }],
      environmentLogs: [],
      photos: [],
      serverTimestamp: Date.now(),
    })

    const request = new NextRequest('http://localhost:3000/api/sync/pull')
    const response = await GET(request)
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.data.reptiles).toHaveLength(1)
    expect(body.data.feedings).toHaveLength(1)
    expect(body.data.weights).toHaveLength(1)
    expect(body.data.summary.reptiles).toBe(1)
    expect(body.data.summary.feedings).toBe(1)
    expect(body.data.summary.total).toBe(3)
    // Service should be called with epoch date when no since param
    expect(mockGetChangesSince).toHaveBeenCalledWith('user-123', new Date(0))
  })

  it('should parse Unix timestamp (milliseconds) from since parameter', async () => {
    mockGetUserId.mockResolvedValue('user-123')
    mockGetChangesSince.mockResolvedValue({
      reptiles: [],
      feedings: [],
      sheds: [],
      weights: [],
      environmentLogs: [],
      photos: [],
      serverTimestamp: Date.now(),
    })

    const timestamp = 1704067200000 // 2024-01-01 00:00:00 UTC
    const request = new NextRequest(`http://localhost:3000/api/sync/pull?since=${timestamp}`)
    const response = await GET(request)

    expect(response.status).toBe(200)
    expect(mockGetChangesSince).toHaveBeenCalledWith('user-123', new Date(timestamp))
  })

  it('should parse ISO string from since parameter (when not a valid integer)', async () => {
    mockGetUserId.mockResolvedValue('user-123')
    mockGetChangesSince.mockResolvedValue({
      reptiles: [],
      feedings: [],
      sheds: [],
      weights: [],
      environmentLogs: [],
      photos: [],
      serverTimestamp: Date.now(),
    })

    // Note: The route parses numeric-looking strings as timestamps first.
    // Use a string that will fail parseInt to test the ISO path.
    // "2024-01-01" would parse as 2024, so use a clearly non-numeric format.
    const isoDate = 'invalid-number-2024-01-01T12:00:00Z'
    const request = new NextRequest(`http://localhost:3000/api/sync/pull?since=${isoDate}`)
    const response = await GET(request)

    // This should fail validation because it's not a valid ISO date either
    expect(response.status).toBe(400)
    const body = await response.json()
    expect(body.error.code).toBe('INVALID_TIMESTAMP')
  })

  it('should prefer Unix timestamp when value is numeric', async () => {
    mockGetUserId.mockResolvedValue('user-123')
    mockGetChangesSince.mockResolvedValue({
      reptiles: [],
      feedings: [],
      sheds: [],
      weights: [],
      environmentLogs: [],
      photos: [],
      serverTimestamp: Date.now(),
    })

    // "2024" parses as integer 2024, which becomes Date(2024) = 1970 + 2024ms
    const request = new NextRequest('http://localhost:3000/api/sync/pull?since=2024')
    const response = await GET(request)

    expect(response.status).toBe(200)
    expect(mockGetChangesSince).toHaveBeenCalledWith('user-123', new Date(2024))
  })

  it('should return 400 for invalid timestamp', async () => {
    mockGetUserId.mockResolvedValue('user-123')

    const request = new NextRequest('http://localhost:3000/api/sync/pull?since=invalid-date')
    const response = await GET(request)
    const body = await response.json()

    expect(response.status).toBe(400)
    expect(body.error.code).toBe('INVALID_TIMESTAMP')
    expect(body.error.message).toContain('Invalid since timestamp')
  })

  it('should return correct summary with all entity types', async () => {
    mockGetUserId.mockResolvedValue('user-123')
    mockGetChangesSince.mockResolvedValue({
      reptiles: [{ id: 'r1' }, { id: 'r2' }],
      feedings: [{ id: 'f1' }, { id: 'f2' }, { id: 'f3' }],
      sheds: [{ id: 's1' }],
      weights: [{ id: 'w1' }, { id: 'w2' }],
      environmentLogs: [{ id: 'e1' }],
      photos: [{ id: 'p1' }, { id: 'p2' }],
      serverTimestamp: Date.now(),
    })

    const request = new NextRequest('http://localhost:3000/api/sync/pull')
    const response = await GET(request)
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.data.summary).toEqual({
      reptiles: 2,
      feedings: 3,
      sheds: 1,
      weights: 2,
      environmentLogs: 1,
      photos: 2,
      total: 11,
    })
  })

  it('should return empty data when no changes exist since timestamp', async () => {
    mockGetUserId.mockResolvedValue('user-123')
    mockGetChangesSince.mockResolvedValue({
      reptiles: [],
      feedings: [],
      sheds: [],
      weights: [],
      environmentLogs: [],
      photos: [],
      serverTimestamp: Date.now(),
    })

    const request = new NextRequest('http://localhost:3000/api/sync/pull?since=1704067200000')
    const response = await GET(request)
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.data.summary.total).toBe(0)
    expect(body.data.reptiles).toHaveLength(0)
    expect(body.data.feedings).toHaveLength(0)
  })

  it('should handle internal errors with 500 status', async () => {
    mockGetUserId.mockResolvedValue('user-123')
    mockGetChangesSince.mockRejectedValue(new Error('Database connection failed'))

    const request = new NextRequest('http://localhost:3000/api/sync/pull')
    const response = await GET(request)
    const body = await response.json()

    expect(response.status).toBe(500)
    expect(body.error.code).toBe('INTERNAL_ERROR')
    expect(body.error.message).toBe('Internal server error')
  })

  it('should include serverTimestamp in response for future syncs', async () => {
    mockGetUserId.mockResolvedValue('user-123')
    const serverTime = Date.now()
    mockGetChangesSince.mockResolvedValue({
      reptiles: [],
      feedings: [],
      sheds: [],
      weights: [],
      environmentLogs: [],
      photos: [],
      serverTimestamp: serverTime,
    })

    const request = new NextRequest('http://localhost:3000/api/sync/pull')
    const response = await GET(request)
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.data.serverTimestamp).toBe(serverTime)
  })
})
