import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest'
import { signIn, signUp, signOut } from './actions'

// Mock dependencies
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`)
  }),
}))

vi.mock('@/lib/logger', () => ({
  logger: {
    child: vi.fn(() => ({
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
    })),
  },
}))

// Mock the server client
const mockSignInWithPassword = vi.fn()
const mockSignUp = vi.fn()
const mockSignOut = vi.fn()

vi.mock('./server', () => ({
  createClient: vi.fn(() =>
    Promise.resolve({
      auth: {
        signInWithPassword: mockSignInWithPassword,
        signUp: mockSignUp,
        signOut: mockSignOut,
      },
    })
  ),
}))

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

describe('Auth Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('signIn', () => {
    const createFormData = (email: string, password: string): FormData => {
      const formData = new FormData()
      formData.set('email', email)
      formData.set('password', password)
      return formData
    }

    describe('validation', () => {
      it('should reject empty email', async () => {
        const formData = createFormData('', 'password123')

        const result = await signIn(formData)

        expect(result.success).toBe(false)
        expect(result.error).toBe('Invalid email address')
        expect(mockSignInWithPassword).not.toHaveBeenCalled()
      })

      it('should reject invalid email format', async () => {
        const formData = createFormData('not-an-email', 'password123')

        const result = await signIn(formData)

        expect(result.success).toBe(false)
        expect(result.error).toBe('Invalid email address')
        expect(mockSignInWithPassword).not.toHaveBeenCalled()
      })

      it('should reject empty password', async () => {
        const formData = createFormData('test@example.com', '')

        const result = await signIn(formData)

        expect(result.success).toBe(false)
        expect(result.error).toBe('Password is required')
        expect(mockSignInWithPassword).not.toHaveBeenCalled()
      })
    })

    describe('successful login', () => {
      it('should sign in user with valid credentials and redirect to dashboard', async () => {
        mockSignInWithPassword.mockResolvedValue({ error: null })
        const formData = createFormData('test@example.com', 'password123')

        await expect(signIn(formData)).rejects.toThrow('REDIRECT:/dashboard')

        expect(mockSignInWithPassword).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'password123',
        })
        expect(revalidatePath).toHaveBeenCalledWith('/', 'layout')
      })
    })

    describe('failed login', () => {
      it('should return error when credentials are invalid', async () => {
        mockSignInWithPassword.mockResolvedValue({
          error: { message: 'Invalid login credentials' },
        })
        const formData = createFormData('test@example.com', 'wrongpassword')

        const result = await signIn(formData)

        expect(result.success).toBe(false)
        expect(result.error).toBe('Invalid login credentials')
      })

      it('should return error when user does not exist', async () => {
        mockSignInWithPassword.mockResolvedValue({
          error: { message: 'User not found' },
        })
        const formData = createFormData('nonexistent@example.com', 'password123')

        const result = await signIn(formData)

        expect(result.success).toBe(false)
        expect(result.error).toBe('User not found')
      })
    })
  })

  describe('signUp', () => {
    const createFormData = (email: string, password: string): FormData => {
      const formData = new FormData()
      formData.set('email', email)
      formData.set('password', password)
      return formData
    }

    describe('validation', () => {
      it('should reject empty email', async () => {
        const formData = createFormData('', 'password123456')

        const result = await signUp(formData)

        expect(result.success).toBe(false)
        expect(result.error).toBe('Invalid email address')
        expect(mockSignUp).not.toHaveBeenCalled()
      })

      it('should reject invalid email format', async () => {
        const formData = createFormData('not-an-email', 'password123456')

        const result = await signUp(formData)

        expect(result.success).toBe(false)
        expect(result.error).toBe('Invalid email address')
        expect(mockSignUp).not.toHaveBeenCalled()
      })

      it('should reject password shorter than 8 characters', async () => {
        const formData = createFormData('test@example.com', 'short')

        const result = await signUp(formData)

        expect(result.success).toBe(false)
        expect(result.error).toBe('Password must be at least 8 characters')
        expect(mockSignUp).not.toHaveBeenCalled()
      })

      it('should accept password with exactly 8 characters', async () => {
        mockSignUp.mockResolvedValue({ error: null })
        const formData = createFormData('test@example.com', '12345678')

        await expect(signUp(formData)).rejects.toThrow('REDIRECT:/login')

        expect(mockSignUp).toHaveBeenCalled()
      })
    })

    describe('successful registration', () => {
      it('should register user with valid data and redirect to login', async () => {
        mockSignUp.mockResolvedValue({ error: null })
        const formData = createFormData('newuser@example.com', 'securepassword123')

        await expect(signUp(formData)).rejects.toThrow(
          'REDIRECT:/login?message=Check your email to confirm your account'
        )

        expect(mockSignUp).toHaveBeenCalledWith({
          email: 'newuser@example.com',
          password: 'securepassword123',
          options: {
            emailRedirectTo: expect.stringContaining('/auth/callback'),
          },
        })
        expect(revalidatePath).toHaveBeenCalledWith('/', 'layout')
      })

      it('should use localhost for emailRedirectTo when NEXT_PUBLIC_SITE_URL is not set', async () => {
        mockSignUp.mockResolvedValue({ error: null })
        const formData = createFormData('newuser@example.com', 'securepassword123')

        await expect(signUp(formData)).rejects.toThrow('REDIRECT:/login')

        expect(mockSignUp).toHaveBeenCalledWith(
          expect.objectContaining({
            options: {
              emailRedirectTo: expect.stringContaining('http://localhost:3000/auth/callback'),
            },
          })
        )
      })
    })

    describe('failed registration', () => {
      it('should return error when email already exists', async () => {
        mockSignUp.mockResolvedValue({
          error: { message: 'User already registered' },
        })
        const formData = createFormData('existing@example.com', 'password123456')

        const result = await signUp(formData)

        expect(result.success).toBe(false)
        expect(result.error).toBe('User already registered')
      })

      it('should return error when Supabase returns an error', async () => {
        mockSignUp.mockResolvedValue({
          error: { message: 'Database connection failed' },
        })
        const formData = createFormData('test@example.com', 'password123456')

        const result = await signUp(formData)

        expect(result.success).toBe(false)
        expect(result.error).toBe('Database connection failed')
      })
    })
  })

  describe('signOut', () => {
    it('should sign out user and redirect to login', async () => {
      mockSignOut.mockResolvedValue({ error: null })

      await expect(signOut()).rejects.toThrow('REDIRECT:/login')

      expect(mockSignOut).toHaveBeenCalled()
      expect(revalidatePath).toHaveBeenCalledWith('/', 'layout')
    })

    it('should still redirect even when sign out fails', async () => {
      mockSignOut.mockResolvedValue({
        error: { message: 'Session not found' },
      })

      await expect(signOut()).rejects.toThrow('REDIRECT:/login')

      expect(mockSignOut).toHaveBeenCalled()
      expect(revalidatePath).toHaveBeenCalledWith('/', 'layout')
    })
  })
})
