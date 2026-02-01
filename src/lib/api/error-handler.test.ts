// Centralized Error Handler Tests
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'
import {
  withErrorHandler,
  type RouteHandlerWithContext,
  type RouteHandlerNoContext,
} from './error-handler'
import { NotFoundError, ForbiddenError, ValidationError } from '@/lib/errors'

// Mock NextResponse.json
vi.mock('next/server', () => ({
  NextRequest: vi.fn(),
  NextResponse: {
    json: vi.fn((data, init) => ({
      data,
      status: init?.status ?? 200,
    })),
  },
}))

// Mock logger
vi.mock('@/lib/logger', () => ({
  createLogger: vi.fn(() => ({
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
  })),
}))

interface RouteContext {
  params: Promise<{ id: string }>
}

describe('withErrorHandler', () => {
  const mockRequest = {} as NextRequest
  const mockContext: RouteContext = { params: Promise.resolve({ id: '123' }) }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('with context (params)', () => {
    it('should pass through successful responses', async () => {
      const handler: RouteHandlerWithContext<RouteContext> = vi
        .fn()
        .mockResolvedValue(NextResponse.json({ data: { success: true } }))

      const wrappedHandler = withErrorHandler(handler, 'TestAPI')
      const result = await wrappedHandler(mockRequest, mockContext)

      expect(handler).toHaveBeenCalledWith(mockRequest, mockContext)
      expect(result).toBeDefined()
    })

    it('should handle NotFoundError', async () => {
      const handler: RouteHandlerWithContext<RouteContext> = vi
        .fn()
        .mockRejectedValue(new NotFoundError('Reptile not found'))

      const wrappedHandler = withErrorHandler(handler, 'TestAPI')
      await wrappedHandler(mockRequest, mockContext)

      expect(NextResponse.json).toHaveBeenCalledWith(
        { error: { code: 'NOT_FOUND', message: 'Reptile not found' } },
        { status: 404 }
      )
    })

    it('should handle ForbiddenError', async () => {
      const handler: RouteHandlerWithContext<RouteContext> = vi
        .fn()
        .mockRejectedValue(new ForbiddenError('Access denied'))

      const wrappedHandler = withErrorHandler(handler, 'TestAPI')
      await wrappedHandler(mockRequest, mockContext)

      expect(NextResponse.json).toHaveBeenCalledWith(
        { error: { code: 'FORBIDDEN', message: 'Access denied' } },
        { status: 403 }
      )
    })

    it('should handle ValidationError', async () => {
      const handler: RouteHandlerWithContext<RouteContext> = vi
        .fn()
        .mockRejectedValue(new ValidationError('Invalid input'))

      const wrappedHandler = withErrorHandler(handler, 'TestAPI')
      await wrappedHandler(mockRequest, mockContext)

      expect(NextResponse.json).toHaveBeenCalledWith(
        { error: { code: 'VALIDATION_ERROR', message: 'Invalid input' } },
        { status: 400 }
      )
    })

    it('should handle generic errors with 500 status', async () => {
      const handler: RouteHandlerWithContext<RouteContext> = vi
        .fn()
        .mockRejectedValue(new Error('Something went wrong'))

      const wrappedHandler = withErrorHandler(handler, 'TestAPI')
      await wrappedHandler(mockRequest, mockContext)

      expect(NextResponse.json).toHaveBeenCalledWith(
        { error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
        { status: 500 }
      )
    })

    it('should handle unknown thrown values', async () => {
      const handler: RouteHandlerWithContext<RouteContext> = vi
        .fn()
        .mockRejectedValue('string error')

      const wrappedHandler = withErrorHandler(handler, 'TestAPI')
      await wrappedHandler(mockRequest, mockContext)

      expect(NextResponse.json).toHaveBeenCalledWith(
        { error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
        { status: 500 }
      )
    })
  })

  describe('without context (no params)', () => {
    it('should pass through successful responses', async () => {
      const handler: RouteHandlerNoContext = vi
        .fn()
        .mockResolvedValue(NextResponse.json({ data: { success: true } }))

      const wrappedHandler = withErrorHandler(handler, 'TestAPI')
      const result = await wrappedHandler(mockRequest)

      expect(handler).toHaveBeenCalledWith(mockRequest)
      expect(result).toBeDefined()
    })

    it('should handle errors correctly', async () => {
      const handler: RouteHandlerNoContext = vi
        .fn()
        .mockRejectedValue(new NotFoundError('Not found'))

      const wrappedHandler = withErrorHandler(handler, 'TestAPI')
      await wrappedHandler(mockRequest)

      expect(NextResponse.json).toHaveBeenCalledWith(
        { error: { code: 'NOT_FOUND', message: 'Not found' } },
        { status: 404 }
      )
    })
  })
})
