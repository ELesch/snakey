'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Suspense, useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { signIn } from '@/lib/supabase/actions'

function LoginForm() {
  const searchParams = useSearchParams()
  const message = searchParams.get('message')

  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const handleSubmit = async (formData: FormData) => {
    setError(null)

    startTransition(async () => {
      const result = await signIn(formData)
      if (!result.success && result.error) {
        setError(result.error)
      }
    })
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl text-[var(--color-primary)]">Welcome Back</CardTitle>
        <CardDescription>Sign in to your Snakey account</CardDescription>
      </CardHeader>
      <form action={handleSubmit}>
        <CardContent className="space-y-4">
          {message && (
            <div className="p-3 text-sm text-[var(--color-success)] bg-[var(--color-success)]/10 border border-[var(--color-success)]/30 rounded-md">
              {message}
            </div>
          )}
          {error && (
            <div
              role="alert"
              aria-live="polite"
              className="p-3 text-sm text-[var(--color-destructive)] bg-[var(--color-destructive)]/10 border border-[var(--color-destructive)]/30 rounded-md"
            >
              {error}
            </div>
          )}
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1 text-[var(--color-foreground)]">
              Email
            </label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              required
              disabled={isPending}
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-1 text-[var(--color-foreground)]">
              Password
            </label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              placeholder="********"
              required
              disabled={isPending}
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? 'Signing in...' : 'Sign In'}
          </Button>
          <p className="text-sm text-center text-[var(--color-muted-foreground)]">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="text-[var(--color-primary)] underline underline-offset-4 hover:text-[var(--color-primary)]/80">
              Sign up
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  )
}

function LoginFormFallback() {
  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl text-[var(--color-primary)]">Welcome Back</CardTitle>
        <CardDescription>Sign in to your Snakey account</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="animate-pulse">
          <div className="h-10 bg-[var(--color-muted)] rounded mb-4" />
          <div className="h-10 bg-[var(--color-muted)] rounded" />
        </div>
      </CardContent>
    </Card>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFormFallback />}>
      <LoginForm />
    </Suspense>
  )
}
