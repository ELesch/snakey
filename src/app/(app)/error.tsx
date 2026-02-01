'use client'

import { useEffect } from 'react'
import { ErrorFallback } from '@/components/error'
import { createLogger } from '@/lib/logger'

const log = createLogger('AppError')

interface AppErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

/**
 * Error Boundary for the authenticated app section
 *
 * Catches errors in the (app) route group and displays a user-friendly
 * error UI while maintaining the app layout structure.
 */
export default function AppError({ error, reset }: AppErrorProps) {
  useEffect(() => {
    // Log error for debugging and monitoring
    log.error(
      {
        message: error.message,
        digest: error.digest,
        stack: error.stack,
      },
      'Error in app section'
    )
  }, [error])

  return (
    <ErrorFallback
      error={error}
      reset={reset}
      title="Something went wrong"
      homeHref="/dashboard"
      homeLabel="Go to Dashboard"
    />
  )
}
