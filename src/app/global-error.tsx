'use client'

import { useEffect } from 'react'
import { AlertCircle, RefreshCw, Home } from 'lucide-react'

interface GlobalErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

/**
 * Global Error Boundary - Handles errors in the root layout
 *
 * This component must define its own <html> and <body> tags because
 * it replaces the root layout when an error occurs.
 */
export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    // Log error to monitoring service in production
    // Using console.error for now - replace with proper logging service
    console.error('Global error caught:', {
      message: error.message,
      digest: error.digest,
      stack: error.stack,
    })
  }, [error])

  return (
    <html lang="en">
      <body className="min-h-screen bg-[var(--color-background)] text-[var(--color-foreground)] antialiased" style={{ '--color-background': 'oklch(0.99 0.005 145)', '--color-foreground': 'oklch(0.15 0.02 145)', '--color-card': 'oklch(1 0 0)', '--color-border': 'oklch(0.90 0.01 145)', '--color-muted-foreground': 'oklch(0.40 0.03 145)', '--color-primary': 'oklch(0.65 0.15 145)', '--color-primary-foreground': 'oklch(0.98 0.01 145)', '--color-destructive': 'oklch(0.55 0.22 25)', '--color-ring': 'oklch(0.65 0.15 145)' } as React.CSSProperties}>
        <div className="flex min-h-screen items-center justify-center p-4">
          <div className="w-full max-w-md rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] p-6 shadow-sm">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-destructive)]/10">
                <AlertCircle className="h-6 w-6 text-[var(--color-destructive)]" />
              </div>
              <h1 className="text-xl font-semibold text-[var(--color-foreground)]">
                Application Error
              </h1>
              <p className="mt-2 text-sm text-[var(--color-muted-foreground)]">
                {error.message || 'An unexpected error occurred. Please try again.'}
              </p>
              {error.digest && (
                <p className="mt-2 text-xs text-[var(--color-muted-foreground)]/70">
                  Error ID: {error.digest}
                </p>
              )}
            </div>
            <div className="mt-6 flex flex-col gap-2">
              <button
                onClick={reset}
                className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-[var(--color-primary-foreground)] transition-colors hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)] focus:ring-offset-2"
              >
                <RefreshCw className="h-4 w-4" />
                Try Again
              </button>
              <a
                href="/"
                className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-2 text-sm font-medium text-[var(--color-foreground)] transition-colors hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)] focus:ring-offset-2"
              >
                <Home className="h-4 w-4" />
                Return Home
              </a>
            </div>
          </div>
        </div>
      </body>
    </html>
  )
}
