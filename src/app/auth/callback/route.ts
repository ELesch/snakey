// Auth Callback Route Handler
// Handles email verification and OAuth redirects from Supabase
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Validates that a redirect path is safe (relative and same-origin)
 * Prevents open redirect vulnerabilities by ensuring:
 * - Path starts with a single forward slash
 * - Does not contain protocol indicators or double slashes
 * - Does not use backslash (which some browsers normalize to forward slash)
 */
function isValidRedirectPath(path: string): boolean {
  // Must start with exactly one forward slash (relative path)
  if (!path.startsWith('/')) return false

  // Must not start with // (protocol-relative URL) or /\ (potential bypass)
  if (path.startsWith('//') || path.startsWith('/\\')) return false

  // Check for protocol indicators anywhere in the path
  if (/^\/[a-z]+:/i.test(path)) return false

  // Check for encoded slashes or backslashes that could bypass validation
  if (/%2f/i.test(path) || /%5c/i.test(path)) return false

  return true
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const nextParam = searchParams.get('next') ?? '/dashboard'

  // Validate the redirect path to prevent open redirect attacks
  const next = isValidRedirectPath(nextParam) ? nextParam : '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // Redirect to the next URL or dashboard on success
      const forwardedHost = request.headers.get('x-forwarded-host')
      const isLocalEnv = process.env.NODE_ENV === 'development'

      if (isLocalEnv) {
        // In development, use origin directly
        return NextResponse.redirect(`${origin}${next}`)
      } else if (forwardedHost) {
        // In production with proxy, use forwarded host
        return NextResponse.redirect(`https://${forwardedHost}${next}`)
      } else {
        // Fallback to origin
        return NextResponse.redirect(`${origin}${next}`)
      }
    }
  }

  // Return to login with error message if code exchange failed
  return NextResponse.redirect(
    `${origin}/login?message=Could not verify email. Please try again.`
  )
}
