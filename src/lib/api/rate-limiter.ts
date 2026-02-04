/**
 * Simple In-Memory Rate Limiter
 *
 * MVP Implementation Notes:
 * - This is a simple in-memory rate limiter suitable for single-instance deployments
 * - For production with multiple instances, upgrade to Upstash Redis or similar
 * - Memory is automatically cleaned up via sliding window expiration
 *
 * @example
 * // In API route
 * const limiter = createRateLimiter({ windowMs: 60000, maxRequests: 10 })
 *
 * export async function POST(request: Request) {
 *   const ip = getClientIp(request)
 *   const result = limiter.check(ip)
 *   if (!result.allowed) {
 *     return Response.json(
 *       { error: 'Too many requests', retryAfter: result.retryAfterMs },
 *       { status: 429 }
 *     )
 *   }
 *   // ... handle request
 * }
 */

import { createLogger } from '@/lib/logger'

const log = createLogger('RateLimiter')

interface RateLimiterConfig {
  /** Time window in milliseconds */
  windowMs: number
  /** Maximum requests allowed per window */
  maxRequests: number
}

interface RateLimitResult {
  /** Whether the request is allowed */
  allowed: boolean
  /** Remaining requests in current window */
  remaining: number
  /** Milliseconds until rate limit resets (only if not allowed) */
  retryAfterMs?: number
}

interface RequestRecord {
  count: number
  windowStart: number
}

/**
 * Creates a rate limiter instance with the specified configuration.
 *
 * @param config - Rate limiter configuration
 * @returns Rate limiter with check method
 */
export function createRateLimiter(config: RateLimiterConfig) {
  const { windowMs, maxRequests } = config
  const requests = new Map<string, RequestRecord>()

  // Cleanup old entries periodically to prevent memory leaks
  // Run cleanup every window interval
  const cleanupInterval = setInterval(() => {
    const now = Date.now()
    for (const [key, record] of requests.entries()) {
      if (now - record.windowStart > windowMs) {
        requests.delete(key)
      }
    }
  }, windowMs)

  // Prevent interval from keeping process alive
  if (cleanupInterval.unref) {
    cleanupInterval.unref()
  }

  return {
    /**
     * Check if a request from the given identifier is allowed.
     *
     * @param identifier - Unique identifier for the client (e.g., IP address, user ID)
     * @returns Rate limit result with allowed status and remaining requests
     */
    check(identifier: string): RateLimitResult {
      const now = Date.now()
      const record = requests.get(identifier)

      // No existing record or window expired - allow and start new window
      if (!record || now - record.windowStart > windowMs) {
        requests.set(identifier, { count: 1, windowStart: now })
        return { allowed: true, remaining: maxRequests - 1 }
      }

      // Within window - check limit
      if (record.count >= maxRequests) {
        const retryAfterMs = windowMs - (now - record.windowStart)
        log.warn(
          { identifier, count: record.count, maxRequests },
          'Rate limit exceeded'
        )
        return { allowed: false, remaining: 0, retryAfterMs }
      }

      // Increment and allow
      record.count++
      return { allowed: true, remaining: maxRequests - record.count }
    },

    /**
     * Reset the rate limit for a specific identifier.
     * Useful for testing or administrative purposes.
     *
     * @param identifier - Unique identifier to reset
     */
    reset(identifier: string): void {
      requests.delete(identifier)
    },

    /**
     * Clear all rate limit records.
     * Useful for testing.
     */
    clear(): void {
      requests.clear()
    },
  }
}

/**
 * Extract client IP address from request headers.
 * Handles common proxy headers (X-Forwarded-For, X-Real-IP).
 *
 * @param request - Incoming request
 * @returns Client IP address or 'unknown' if not determinable
 */
export function getClientIp(request: Request): string {
  // Check X-Forwarded-For header (common for proxies/load balancers)
  const forwardedFor = request.headers.get('x-forwarded-for')
  if (forwardedFor) {
    // X-Forwarded-For can contain multiple IPs - first one is the client
    const firstIp = forwardedFor.split(',')[0]?.trim()
    if (firstIp) return firstIp
  }

  // Check X-Real-IP header (nginx)
  const realIp = request.headers.get('x-real-ip')
  if (realIp) return realIp

  // Fallback - in production this shouldn't happen behind a proper proxy
  return 'unknown'
}

// Pre-configured limiters for common use cases

/**
 * Rate limiter for authentication endpoints.
 * 5 attempts per minute to prevent brute force attacks.
 */
export const authRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 5,
})

/**
 * Rate limiter for file upload endpoints.
 * 10 uploads per minute to prevent abuse.
 */
export const uploadRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 10,
})

/**
 * Rate limiter for general API endpoints.
 * 100 requests per minute for normal usage.
 */
export const apiRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 100,
})
