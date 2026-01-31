import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createClient, getSession, getUser, getUserId } from './server'

// Mock @supabase/ssr
const mockGetAll = vi.fn()
const mockSet = vi.fn()
const mockGetSession = vi.fn()
const mockGetUser = vi.fn()

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(() => ({
    auth: {
      getSession: mockGetSession,
      getUser: mockGetUser,
    },
  })),
}))

// Mock next/headers
vi.mock('next/headers', () => ({
  cookies: vi.fn(() =>
    Promise.resolve({
      getAll: mockGetAll,
      set: mockSet,
    })
  ),
}))

describe('Supabase Server', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetAll.mockReturnValue([])
  })

  describe('createClient', () => {
    it('should create a Supabase client with cookie handlers', async () => {
      const client = await createClient()

      expect(client).toBeDefined()
      expect(client.auth).toBeDefined()
    })
  })

  describe('getSession', () => {
    it('should return session when user is authenticated', async () => {
      const mockSession = {
        access_token: 'test-token',
        refresh_token: 'test-refresh',
        user: { id: 'user-123', email: 'test@example.com' },
        expires_at: Date.now() + 3600000,
      }
      mockGetSession.mockResolvedValue({
        data: { session: mockSession },
        error: null,
      })

      const session = await getSession()

      expect(session).toEqual(mockSession)
      expect(mockGetSession).toHaveBeenCalled()
    })

    it('should return null when no session exists', async () => {
      mockGetSession.mockResolvedValue({
        data: { session: null },
        error: null,
      })

      const session = await getSession()

      expect(session).toBeNull()
    })

    it('should return null when there is an error', async () => {
      mockGetSession.mockResolvedValue({
        data: { session: null },
        error: { message: 'Session expired' },
      })

      const session = await getSession()

      expect(session).toBeNull()
    })

    it('should return null when session data is missing', async () => {
      mockGetSession.mockResolvedValue({
        data: { session: undefined },
        error: null,
      })

      const session = await getSession()

      expect(session).toBeNull()
    })
  })

  describe('getUser', () => {
    it('should return user when authenticated', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        created_at: '2024-01-01T00:00:00Z',
      }
      mockGetUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      const user = await getUser()

      expect(user).toEqual(mockUser)
      expect(mockGetUser).toHaveBeenCalled()
    })

    it('should return null when no user exists', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
        error: null,
      })

      const user = await getUser()

      expect(user).toBeNull()
    })

    it('should return null when there is an error', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Invalid token' },
      })

      const user = await getUser()

      expect(user).toBeNull()
    })

    it('should return null when user data is missing', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: undefined },
        error: null,
      })

      const user = await getUser()

      expect(user).toBeNull()
    })
  })

  describe('getUserId', () => {
    it('should return user ID when authenticated', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
      }
      mockGetUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      const userId = await getUserId()

      expect(userId).toBe('user-123')
    })

    it('should return null when no user exists', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
        error: null,
      })

      const userId = await getUserId()

      expect(userId).toBeNull()
    })

    it('should return null when there is an error', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Session expired' },
      })

      const userId = await getUserId()

      expect(userId).toBeNull()
    })
  })
})
