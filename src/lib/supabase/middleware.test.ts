import { describe, it, expect, vi, beforeEach } from 'vitest'
import { updateSession } from './middleware'
import { NextResponse, type NextRequest } from 'next/server'

// Mock @supabase/ssr
const mockGetUser = vi.fn()

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(() => ({
    auth: {
      getUser: mockGetUser,
    },
  })),
}))

// Helper to create mock NextRequest
function createMockRequest(pathname: string): NextRequest {
  const url = new URL(`http://localhost:3000${pathname}`)
  const cookies = new Map<string, string>()

  return {
    nextUrl: {
      pathname,
      clone: () => {
        // Return a proper URL object that Next.js can use
        const clonedUrl = new URL(url.toString())
        return clonedUrl
      },
    },
    cookies: {
      getAll: () => Array.from(cookies.entries()).map(([name, value]) => ({ name, value })),
      set: (name: string, value: string) => cookies.set(name, value),
    },
  } as unknown as NextRequest
}

describe('Supabase Middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('updateSession', () => {
    describe('public routes', () => {
      it('should allow unauthenticated access to /login', async () => {
        mockGetUser.mockResolvedValue({ data: { user: null } })
        const request = createMockRequest('/login')

        const response = await updateSession(request)

        expect(response.headers.get('location')).toBeNull()
      })

      it('should allow unauthenticated access to /register', async () => {
        mockGetUser.mockResolvedValue({ data: { user: null } })
        const request = createMockRequest('/register')

        const response = await updateSession(request)

        expect(response.headers.get('location')).toBeNull()
      })

      it('should allow unauthenticated access to /auth/callback', async () => {
        mockGetUser.mockResolvedValue({ data: { user: null } })
        const request = createMockRequest('/auth/callback')

        const response = await updateSession(request)

        expect(response.headers.get('location')).toBeNull()
      })

      it('should redirect authenticated user from /login to /dashboard', async () => {
        mockGetUser.mockResolvedValue({
          data: { user: { id: 'user-123', email: 'test@example.com' } },
        })
        const request = createMockRequest('/login')

        const response = await updateSession(request)

        expect(response.headers.get('location')).toBe('http://localhost:3000/dashboard')
      })

      it('should redirect authenticated user from /register to /dashboard', async () => {
        mockGetUser.mockResolvedValue({
          data: { user: { id: 'user-123', email: 'test@example.com' } },
        })
        const request = createMockRequest('/register')

        const response = await updateSession(request)

        expect(response.headers.get('location')).toBe('http://localhost:3000/dashboard')
      })

      it('should NOT redirect authenticated user from /auth/callback', async () => {
        mockGetUser.mockResolvedValue({
          data: { user: { id: 'user-123', email: 'test@example.com' } },
        })
        const request = createMockRequest('/auth/callback')

        const response = await updateSession(request)

        expect(response.headers.get('location')).toBeNull()
      })
    })

    describe('protected routes', () => {
      it('should redirect unauthenticated user from /dashboard to /login', async () => {
        mockGetUser.mockResolvedValue({ data: { user: null } })
        const request = createMockRequest('/dashboard')

        const response = await updateSession(request)

        expect(response.headers.get('location')).toBe('http://localhost:3000/login')
      })

      it('should redirect unauthenticated user from /reptiles to /login', async () => {
        mockGetUser.mockResolvedValue({ data: { user: null } })
        const request = createMockRequest('/reptiles')

        const response = await updateSession(request)

        expect(response.headers.get('location')).toBe('http://localhost:3000/login')
      })

      it('should redirect unauthenticated user from /settings to /login', async () => {
        mockGetUser.mockResolvedValue({ data: { user: null } })
        const request = createMockRequest('/settings')

        const response = await updateSession(request)

        expect(response.headers.get('location')).toBe('http://localhost:3000/login')
      })

      it('should redirect unauthenticated user from nested protected route to /login', async () => {
        mockGetUser.mockResolvedValue({ data: { user: null } })
        const request = createMockRequest('/reptiles/123')

        const response = await updateSession(request)

        expect(response.headers.get('location')).toBe('http://localhost:3000/login')
      })

      it('should allow authenticated access to /dashboard', async () => {
        mockGetUser.mockResolvedValue({
          data: { user: { id: 'user-123', email: 'test@example.com' } },
        })
        const request = createMockRequest('/dashboard')

        const response = await updateSession(request)

        expect(response.headers.get('location')).toBeNull()
      })

      it('should allow authenticated access to /reptiles', async () => {
        mockGetUser.mockResolvedValue({
          data: { user: { id: 'user-123', email: 'test@example.com' } },
        })
        const request = createMockRequest('/reptiles')

        const response = await updateSession(request)

        expect(response.headers.get('location')).toBeNull()
      })

      it('should allow authenticated access to /settings', async () => {
        mockGetUser.mockResolvedValue({
          data: { user: { id: 'user-123', email: 'test@example.com' } },
        })
        const request = createMockRequest('/settings')

        const response = await updateSession(request)

        expect(response.headers.get('location')).toBeNull()
      })
    })

    describe('non-protected routes', () => {
      it('should allow unauthenticated access to root', async () => {
        mockGetUser.mockResolvedValue({ data: { user: null } })
        const request = createMockRequest('/')

        const response = await updateSession(request)

        expect(response.headers.get('location')).toBeNull()
      })

      it('should allow unauthenticated access to static paths', async () => {
        mockGetUser.mockResolvedValue({ data: { user: null } })
        const request = createMockRequest('/about')

        const response = await updateSession(request)

        expect(response.headers.get('location')).toBeNull()
      })

      it('should allow authenticated access to non-protected routes', async () => {
        mockGetUser.mockResolvedValue({
          data: { user: { id: 'user-123', email: 'test@example.com' } },
        })
        const request = createMockRequest('/')

        const response = await updateSession(request)

        expect(response.headers.get('location')).toBeNull()
      })
    })
  })
})
