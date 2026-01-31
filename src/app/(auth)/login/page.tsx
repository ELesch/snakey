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
        <CardTitle className="text-2xl text-primary-700">Welcome Back</CardTitle>
        <CardDescription>Sign in to your Snakey account</CardDescription>
      </CardHeader>
      <form action={handleSubmit}>
        <CardContent className="space-y-4">
          {message && (
            <div className="p-3 text-sm text-green-700 bg-green-50 border border-green-200 rounded-md">
              {message}
            </div>
          )}
          {error && (
            <div className="p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md">
              {error}
            </div>
          )}
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1">
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
            <label htmlFor="password" className="block text-sm font-medium mb-1">
              Password
            </label>
            <Input
              id="password"
              name="password"
              type="password"
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
          <p className="text-sm text-center text-warm-600">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="text-primary-600 hover:underline">
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
        <CardTitle className="text-2xl text-primary-700">Welcome Back</CardTitle>
        <CardDescription>Sign in to your Snakey account</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="animate-pulse">
          <div className="h-10 bg-warm-200 rounded mb-4" />
          <div className="h-10 bg-warm-200 rounded" />
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
