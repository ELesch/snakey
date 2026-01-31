'use server'

// Server Actions for Supabase Authentication
// Handles login, registration, and logout operations
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from './server'
import { z } from 'zod'
import { logger } from '@/lib/logger'

const log = logger.child({ context: 'AuthActions' })

// Validation schemas
const LoginSchema = z.object({
  email: z.email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

const SignUpSchema = z.object({
  email: z.email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

export type AuthResult = {
  success: boolean
  error?: string
}

/**
 * Signs in a user with email and password.
 */
export async function signIn(formData: FormData): Promise<AuthResult> {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  // Validate input
  const validated = LoginSchema.safeParse({ email, password })
  if (!validated.success) {
    const errorMessage = validated.error.issues[0]?.message ?? 'Invalid input'
    log.warn({ email }, 'Login validation failed')
    return { success: false, error: errorMessage }
  }

  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({
    email: validated.data.email,
    password: validated.data.password,
  })

  if (error) {
    log.warn({ email, error: error.message }, 'Login failed')
    return { success: false, error: error.message }
  }

  log.info({ email }, 'User logged in successfully')
  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

/**
 * Signs up a new user with email and password.
 */
export async function signUp(formData: FormData): Promise<AuthResult> {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  // Validate input
  const validated = SignUpSchema.safeParse({ email, password })
  if (!validated.success) {
    const errorMessage = validated.error.issues[0]?.message ?? 'Invalid input'
    log.warn({ email }, 'Registration validation failed')
    return { success: false, error: errorMessage }
  }

  const supabase = await createClient()

  const { error } = await supabase.auth.signUp({
    email: validated.data.email,
    password: validated.data.password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'}/auth/callback`,
    },
  })

  if (error) {
    log.warn({ email, error: error.message }, 'Registration failed')
    return { success: false, error: error.message }
  }

  log.info({ email }, 'User registered successfully')
  revalidatePath('/', 'layout')
  redirect('/login?message=Check your email to confirm your account')
}

/**
 * Signs out the current user.
 */
export async function signOut(): Promise<void> {
  const supabase = await createClient()

  const { error } = await supabase.auth.signOut()

  if (error) {
    log.error({ error: error.message }, 'Sign out failed')
  }

  log.info('User signed out')
  revalidatePath('/', 'layout')
  redirect('/login')
}
