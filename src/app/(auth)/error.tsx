'use client'

import { useEffect } from 'react'
import { ErrorFallback } from '@/components/error'
import { createLogger } from '@/lib/logger'

const log = createLogger('AuthError')

interface AuthErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

/**
 * Error Boundary for the authentication section
 *
 * Catches errors in the (auth) route group (login, register, etc.)
 * and displays an auth-themed error UI.
 */
export default function AuthError({ error, reset }: AuthErrorProps) {
  useEffect(() => {
    // Log error for debugging and monitoring
    log.error(
      {
        message: error.message,
        digest: error.digest,
        stack: error.stack,
      },
      'Error in auth section'
    )
  }, [error])

  return (
    <ErrorFallback
      error={error}
      reset={reset}
      title="Authentication Error"
      homeHref="/login"
      homeLabel="Back to Login"
    />
  )
}
