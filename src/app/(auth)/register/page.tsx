'use client'

import Link from 'next/link'
import { useState, useTransition } from 'react'
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
import { signUp } from '@/lib/supabase/actions'

export default function RegisterPage() {
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const handleSubmit = async (formData: FormData) => {
    setError(null)

    // Client-side password confirmation check
    const password = formData.get('password') as string
    const confirmPassword = formData.get('confirmPassword') as string

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    startTransition(async () => {
      const result = await signUp(formData)
      if (!result.success && result.error) {
        setError(result.error)
      }
    })
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl text-[var(--color-primary)]">Create Account</CardTitle>
        <CardDescription>Start tracking your reptile collection</CardDescription>
      </CardHeader>
      <form action={handleSubmit}>
        <CardContent className="space-y-4">
          {error && (
            <div className="p-3 text-sm text-[var(--color-destructive)] bg-[var(--color-destructive)]/10 border border-[var(--color-destructive)]/30 rounded-md">
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
              placeholder="********"
              minLength={8}
              required
              disabled={isPending}
            />
            <p className="text-xs text-[var(--color-muted-foreground)] mt-1">
              Must be at least 8 characters
            </p>
          </div>
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium mb-1 text-[var(--color-foreground)]">
              Confirm Password
            </label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              placeholder="********"
              minLength={8}
              required
              disabled={isPending}
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? 'Creating account...' : 'Create Account'}
          </Button>
          <p className="text-sm text-center text-[var(--color-muted-foreground)]">
            Already have an account?{' '}
            <Link href="/login" className="text-[var(--color-primary)] hover:underline">
              Sign in
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  )
}
