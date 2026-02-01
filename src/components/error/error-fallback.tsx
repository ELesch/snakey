'use client'

import Link from 'next/link'
import { AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

interface ErrorFallbackProps {
  error: Error & { digest?: string }
  reset: () => void
  title?: string
  homeHref?: string
  homeLabel?: string
  showHomeLink?: boolean
}

export function ErrorFallback({
  error,
  reset,
  title = 'Something went wrong',
  homeHref = '/dashboard',
  homeLabel = 'Go to Dashboard',
  showHomeLink = true,
}: ErrorFallbackProps) {
  return (
    <div className="flex min-h-[400px] items-center justify-center p-4">
      <Card className="w-full max-w-md" role="alert">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-destructive)]/10">
            <AlertCircle className="h-6 w-6 text-[var(--color-destructive)]" />
          </div>
          <CardTitle className="text-xl">{title}</CardTitle>
          <CardDescription className="mt-2">
            {error.message || 'An unexpected error occurred'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error.digest && (
            <p className="text-center text-xs text-[var(--color-muted-foreground)]">
              Error ID: {error.digest}
            </p>
          )}
        </CardContent>
        <CardFooter className="flex flex-col gap-2">
          <Button onClick={reset} className="w-full">
            Try Again
          </Button>
          {showHomeLink && (
            <Button variant="outline" asChild className="w-full">
              <Link href={homeHref}>{homeLabel}</Link>
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}
