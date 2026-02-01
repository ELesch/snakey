// API Route Tests: GET /api/dashboard/stats
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest } from 'next/server'
import { GET } from './route'

// Mock the dashboard service
const mockGetStats = vi.fn()

vi.mock('@/services/dashboard.service', () => ({
  dashboardService: {
    getStats: (...args: unknown[]) => mockGetStats(...args),
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

// Mock error classes
vi.mock('@/lib/errors', () => ({
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

describe('GET /api/dashboard/stats', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  it('should return 401 when user is not authenticated', async () => {
    mockGetUserId.mockResolvedValue(null)

    const request = new NextRequest('http://localhost:3000/api/dashboard/stats')
    const response = await GET(request)
    const body = await response.json()

    expect(response.status).toBe(401)
    expect(body.error.code).toBe('UNAUTHORIZED')
    expect(body.error.message).toBe('Authentication required')
  })

  it('should return dashboard stats for authenticated user', async () => {
    mockGetUserId.mockResolvedValue('user-123')
    mockGetStats.mockResolvedValue({
      totalReptiles: 5,
      feedingsDue: 2,
      recentWeights: 10,
      environmentAlerts: 1,
    })

    const request = new NextRequest('http://localhost:3000/api/dashboard/stats')
    const response = await GET(request)
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.data).toEqual({
      totalReptiles: 5,
      feedingsDue: 2,
      recentWeights: 10,
      environmentAlerts: 1,
    })
    expect(mockGetStats).toHaveBeenCalledWith('user-123')
  })

  it('should return zero stats for user with no reptiles', async () => {
    mockGetUserId.mockResolvedValue('user-123')
    mockGetStats.mockResolvedValue({
      totalReptiles: 0,
      feedingsDue: 0,
      recentWeights: 0,
      environmentAlerts: 0,
    })

    const request = new NextRequest('http://localhost:3000/api/dashboard/stats')
    const response = await GET(request)
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.data.totalReptiles).toBe(0)
    expect(body.data.feedingsDue).toBe(0)
    expect(body.data.recentWeights).toBe(0)
    expect(body.data.environmentAlerts).toBe(0)
  })

  it('should handle internal errors with 500 status', async () => {
    mockGetUserId.mockResolvedValue('user-123')
    mockGetStats.mockRejectedValue(new Error('Database connection failed'))

    const request = new NextRequest('http://localhost:3000/api/dashboard/stats')
    const response = await GET(request)
    const body = await response.json()

    expect(response.status).toBe(500)
    expect(body.error.code).toBe('INTERNAL_ERROR')
    expect(body.error.message).toBe('Internal server error')
  })

  it('should return stats with high activity counts', async () => {
    mockGetUserId.mockResolvedValue('user-123')
    mockGetStats.mockResolvedValue({
      totalReptiles: 50,
      feedingsDue: 15,
      recentWeights: 200,
      environmentAlerts: 8,
    })

    const request = new NextRequest('http://localhost:3000/api/dashboard/stats')
    const response = await GET(request)
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.data.totalReptiles).toBe(50)
    expect(body.data.feedingsDue).toBe(15)
    expect(body.data.recentWeights).toBe(200)
    expect(body.data.environmentAlerts).toBe(8)
  })
})
