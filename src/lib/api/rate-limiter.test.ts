// Rate Limiter Tests
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  createRateLimiter,
  getClientIp,
  authRateLimiter,
  uploadRateLimiter,
  apiRateLimiter,
} from './rate-limiter'

// Mock logger
vi.mock('@/lib/logger', () => ({
  createLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  }),
}))

describe('createRateLimiter', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should allow requests under the limit', () => {
    const limiter = createRateLimiter({ windowMs: 60000, maxRequests: 5 })

    const result1 = limiter.check('client-1')
    const result2 = limiter.check('client-1')
    const result3 = limiter.check('client-1')

    expect(result1.allowed).toBe(true)
    expect(result2.allowed).toBe(true)
    expect(result3.allowed).toBe(true)
  })

  it('should track remaining requests correctly', () => {
    const limiter = createRateLimiter({ windowMs: 60000, maxRequests: 5 })

    const result1 = limiter.check('client-1')
    const result2 = limiter.check('client-1')
    const result3 = limiter.check('client-1')

    expect(result1.remaining).toBe(4)
    expect(result2.remaining).toBe(3)
    expect(result3.remaining).toBe(2)
  })

  it('should block requests over the limit', () => {
    const limiter = createRateLimiter({ windowMs: 60000, maxRequests: 3 })

    limiter.check('client-1') // 1st - allowed
    limiter.check('client-1') // 2nd - allowed
    limiter.check('client-1') // 3rd - allowed

    const result = limiter.check('client-1') // 4th - blocked

    expect(result.allowed).toBe(false)
    expect(result.remaining).toBe(0)
  })

  it('should return retryAfterMs when blocked', () => {
    const limiter = createRateLimiter({ windowMs: 60000, maxRequests: 2 })

    limiter.check('client-1')
    limiter.check('client-1')

    // Advance time by 10 seconds
    vi.advanceTimersByTime(10000)

    const result = limiter.check('client-1')

    expect(result.allowed).toBe(false)
    expect(result.retryAfterMs).toBeDefined()
    // Should be approximately 50000ms (60000 - 10000)
    expect(result.retryAfterMs).toBeLessThanOrEqual(50000)
    expect(result.retryAfterMs).toBeGreaterThan(49000)
  })

  it('should track different clients separately', () => {
    const limiter = createRateLimiter({ windowMs: 60000, maxRequests: 2 })

    limiter.check('client-1')
    limiter.check('client-1')
    const blocked = limiter.check('client-1')

    const client2Result = limiter.check('client-2')

    expect(blocked.allowed).toBe(false)
    expect(client2Result.allowed).toBe(true)
    expect(client2Result.remaining).toBe(1)
  })

  it('should reset after window expires', () => {
    const limiter = createRateLimiter({ windowMs: 60000, maxRequests: 2 })

    limiter.check('client-1')
    limiter.check('client-1')
    const blocked = limiter.check('client-1')

    expect(blocked.allowed).toBe(false)

    // Advance time past the window
    vi.advanceTimersByTime(61000)

    const afterReset = limiter.check('client-1')
    expect(afterReset.allowed).toBe(true)
    expect(afterReset.remaining).toBe(1)
  })

  it('should reset a specific client', () => {
    const limiter = createRateLimiter({ windowMs: 60000, maxRequests: 2 })

    limiter.check('client-1')
    limiter.check('client-1')
    limiter.check('client-2')

    limiter.reset('client-1')

    const client1 = limiter.check('client-1')
    const client2 = limiter.check('client-2')

    expect(client1.remaining).toBe(1) // Fresh start
    expect(client2.remaining).toBe(0) // Still tracking
  })

  it('should clear all clients', () => {
    const limiter = createRateLimiter({ windowMs: 60000, maxRequests: 2 })

    limiter.check('client-1')
    limiter.check('client-1')
    limiter.check('client-2')

    limiter.clear()

    const client1 = limiter.check('client-1')
    const client2 = limiter.check('client-2')

    expect(client1.remaining).toBe(1) // Fresh start
    expect(client2.remaining).toBe(1) // Fresh start
  })

  it('should handle single request limit', () => {
    const limiter = createRateLimiter({ windowMs: 60000, maxRequests: 1 })

    const first = limiter.check('client-1')
    const second = limiter.check('client-1')

    expect(first.allowed).toBe(true)
    expect(first.remaining).toBe(0)
    expect(second.allowed).toBe(false)
  })

  it('should handle large request limits', () => {
    const limiter = createRateLimiter({ windowMs: 60000, maxRequests: 1000 })

    const result = limiter.check('client-1')

    expect(result.allowed).toBe(true)
    expect(result.remaining).toBe(999)
  })

  it('should handle very short window', () => {
    const limiter = createRateLimiter({ windowMs: 100, maxRequests: 2 })

    limiter.check('client-1')
    limiter.check('client-1')
    const blocked = limiter.check('client-1')

    expect(blocked.allowed).toBe(false)

    // Advance past the short window
    vi.advanceTimersByTime(150)

    const afterReset = limiter.check('client-1')
    expect(afterReset.allowed).toBe(true)
  })

  it('should not include retryAfterMs when allowed', () => {
    const limiter = createRateLimiter({ windowMs: 60000, maxRequests: 5 })

    const result = limiter.check('client-1')

    expect(result.allowed).toBe(true)
    expect(result.retryAfterMs).toBeUndefined()
  })

  describe('memory cleanup', () => {
    it('should clean up expired entries periodically', () => {
      const limiter = createRateLimiter({ windowMs: 1000, maxRequests: 5 })

      // Make requests
      limiter.check('client-1')
      limiter.check('client-2')

      // Advance time to trigger cleanup
      vi.advanceTimersByTime(1500)

      // Old entries should be cleaned up, so these should start fresh
      const result1 = limiter.check('client-1')
      const result2 = limiter.check('client-2')

      expect(result1.remaining).toBe(4) // Fresh start after cleanup
      expect(result2.remaining).toBe(4) // Fresh start after cleanup
    })
  })
})

describe('getClientIp', () => {
  it('should extract IP from X-Forwarded-For header', () => {
    const mockRequest = {
      headers: new Headers({
        'x-forwarded-for': '192.168.1.1',
      }),
    } as Request

    const ip = getClientIp(mockRequest)

    expect(ip).toBe('192.168.1.1')
  })

  it('should extract first IP from X-Forwarded-For with multiple IPs', () => {
    const mockRequest = {
      headers: new Headers({
        'x-forwarded-for': '192.168.1.1, 10.0.0.1, 172.16.0.1',
      }),
    } as Request

    const ip = getClientIp(mockRequest)

    expect(ip).toBe('192.168.1.1')
  })

  it('should extract IP from X-Real-IP header', () => {
    const mockRequest = {
      headers: new Headers({
        'x-real-ip': '10.0.0.100',
      }),
    } as Request

    const ip = getClientIp(mockRequest)

    expect(ip).toBe('10.0.0.100')
  })

  it('should prefer X-Forwarded-For over X-Real-IP', () => {
    const mockRequest = {
      headers: new Headers({
        'x-forwarded-for': '192.168.1.1',
        'x-real-ip': '10.0.0.100',
      }),
    } as Request

    const ip = getClientIp(mockRequest)

    expect(ip).toBe('192.168.1.1')
  })

  it('should return unknown when no IP headers present', () => {
    const mockRequest = {
      headers: new Headers({}),
    } as Request

    const ip = getClientIp(mockRequest)

    expect(ip).toBe('unknown')
  })

  it('should handle whitespace in X-Forwarded-For header', () => {
    const mockRequest = {
      headers: new Headers({
        'x-forwarded-for': '  192.168.1.1  ,  10.0.0.1  ',
      }),
    } as Request

    const ip = getClientIp(mockRequest)

    expect(ip).toBe('192.168.1.1')
  })

  it('should handle IPv6 addresses', () => {
    const mockRequest = {
      headers: new Headers({
        'x-forwarded-for': '2001:0db8:85a3:0000:0000:8a2e:0370:7334',
      }),
    } as Request

    const ip = getClientIp(mockRequest)

    expect(ip).toBe('2001:0db8:85a3:0000:0000:8a2e:0370:7334')
  })

  it('should handle empty X-Forwarded-For and fall back to X-Real-IP', () => {
    const mockRequest = {
      headers: new Headers({
        'x-forwarded-for': '',
        'x-real-ip': '10.0.0.100',
      }),
    } as Request

    const ip = getClientIp(mockRequest)

    expect(ip).toBe('10.0.0.100')
  })
})

describe('Pre-configured rate limiters', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    // Clear all pre-configured limiters before each test
    authRateLimiter.clear()
    uploadRateLimiter.clear()
    apiRateLimiter.clear()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('authRateLimiter', () => {
    it('should allow 5 requests per minute', () => {
      const results = []
      for (let i = 0; i < 5; i++) {
        results.push(authRateLimiter.check('test-client'))
      }

      expect(results.every((r) => r.allowed)).toBe(true)
      expect(results[4].remaining).toBe(0)
    })

    it('should block 6th request', () => {
      for (let i = 0; i < 5; i++) {
        authRateLimiter.check('test-client')
      }

      const result = authRateLimiter.check('test-client')

      expect(result.allowed).toBe(false)
    })

    it('should reset after 1 minute', () => {
      for (let i = 0; i < 5; i++) {
        authRateLimiter.check('test-client')
      }

      vi.advanceTimersByTime(61000)

      const result = authRateLimiter.check('test-client')
      expect(result.allowed).toBe(true)
    })
  })

  describe('uploadRateLimiter', () => {
    it('should allow 10 requests per minute', () => {
      const results = []
      for (let i = 0; i < 10; i++) {
        results.push(uploadRateLimiter.check('test-client'))
      }

      expect(results.every((r) => r.allowed)).toBe(true)
      expect(results[9].remaining).toBe(0)
    })

    it('should block 11th request', () => {
      for (let i = 0; i < 10; i++) {
        uploadRateLimiter.check('test-client')
      }

      const result = uploadRateLimiter.check('test-client')

      expect(result.allowed).toBe(false)
    })
  })

  describe('apiRateLimiter', () => {
    it('should allow 100 requests per minute', () => {
      const results = []
      for (let i = 0; i < 100; i++) {
        results.push(apiRateLimiter.check('test-client'))
      }

      expect(results.every((r) => r.allowed)).toBe(true)
      expect(results[99].remaining).toBe(0)
    })

    it('should block 101st request', () => {
      for (let i = 0; i < 100; i++) {
        apiRateLimiter.check('test-client')
      }

      const result = apiRateLimiter.check('test-client')

      expect(result.allowed).toBe(false)
    })
  })
})
