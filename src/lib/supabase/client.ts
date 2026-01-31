// Supabase Browser Client with SSR support
// Uses @supabase/ssr for proper cookie-based session handling in Next.js 15
import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

/**
 * Creates a Supabase client for use in browser/client components.
 * Uses cookie-based session storage for seamless SSR integration.
 */
export function createClient() {
  return createBrowserClient(supabaseUrl!, supabaseAnonKey!)
}

// Export a singleton instance for convenience in client components
export const supabase = createClient()

export default supabase
