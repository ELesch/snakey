// API Response Utilities Tests
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextResponse } from 'next/server'
import { successResponse, errorResponse, listResponse } from './response'

// Mock NextResponse.json
vi.mock('next/server', () => ({
  NextResponse: {
    json: vi.fn((data, init) => ({
      data,
      status: init?.status ?? 200,
    })),
  },
}))

describe('API Response Utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('successResponse', () => {
    it('should wrap data in { data } envelope', () => {
      successResponse({ id: '123', name: 'Test' })

      expect(NextResponse.json).toHaveBeenCalledWith(
        { data: { id: '123', name: 'Test' } },
        { status: 200 }
      )
    })

    it('should include meta when provided', () => {
      successResponse({ id: '123' }, { cached: true })

      expect(NextResponse.json).toHaveBeenCalledWith(
        { data: { id: '123' }, meta: { cached: true } },
        { status: 200 }
      )
    })

    it('should support custom status code', () => {
      successResponse({ id: '123' }, undefined, 201)

      expect(NextResponse.json).toHaveBeenCalledWith(
        { data: { id: '123' } },
        { status: 201 }
      )
    })
  })

  describe('errorResponse', () => {
    it('should return error envelope with code and message', () => {
      errorResponse('UNAUTHORIZED', 'Authentication required', 401)

      expect(NextResponse.json).toHaveBeenCalledWith(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      )
    })

    it('should include details when provided', () => {
      const details = { field: 'email', reason: 'invalid format' }
      errorResponse('VALIDATION_ERROR', 'Invalid input', 400, details)

      expect(NextResponse.json).toHaveBeenCalledWith(
        { error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details } },
        { status: 400 }
      )
    })

    it('should handle array details (Zod issues)', () => {
      const issues = [
        { path: ['name'], message: 'Required' },
        { path: ['age'], message: 'Must be positive' },
      ]
      errorResponse('INVALID_QUERY_PARAMS', 'Invalid parameters', 400, issues)

      expect(NextResponse.json).toHaveBeenCalledWith(
        { error: { code: 'INVALID_QUERY_PARAMS', message: 'Invalid parameters', details: issues } },
        { status: 400 }
      )
    })
  })

  describe('listResponse', () => {
    it('should wrap array in { data, meta } envelope with count', () => {
      const items = [{ id: '1' }, { id: '2' }, { id: '3' }]
      listResponse(items)

      expect(NextResponse.json).toHaveBeenCalledWith(
        { data: items, meta: { count: 3 } },
        { status: 200 }
      )
    })

    it('should include pagination meta when provided', () => {
      const items = [{ id: '1' }, { id: '2' }]
      listResponse(items, { page: 1, pageSize: 10, total: 50 })

      expect(NextResponse.json).toHaveBeenCalledWith(
        { data: items, meta: { count: 2, page: 1, pageSize: 10, total: 50 } },
        { status: 200 }
      )
    })

    it('should handle empty arrays', () => {
      listResponse([])

      expect(NextResponse.json).toHaveBeenCalledWith(
        { data: [], meta: { count: 0 } },
        { status: 200 }
      )
    })

    it('should allow custom meta fields', () => {
      const items = [{ id: '1' }]
      listResponse(items, { hasMore: true, cursor: 'abc123' })

      expect(NextResponse.json).toHaveBeenCalledWith(
        { data: items, meta: { count: 1, hasMore: true, cursor: 'abc123' } },
        { status: 200 }
      )
    })
  })
})
