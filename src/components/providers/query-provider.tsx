'use client'

import { useState } from 'react'
import { QueryClient, QueryClientProvider, QueryCache, MutationCache } from '@tanstack/react-query'
import { createLogger } from '@/lib/logger'

const log = createLogger('QueryProvider')

interface QueryProviderProps {
  children: React.ReactNode
}

export function QueryProvider({ children }: QueryProviderProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            gcTime: 5 * 60 * 1000, // 5 minutes (formerly cacheTime)
            retry: 1,
            refetchOnWindowFocus: false,
          },
          mutations: {
            retry: 1,
          },
        },
        queryCache: new QueryCache({
          onError: (error, query) => {
            log.error(
              {
                error: error instanceof Error ? error.message : String(error),
                queryKey: query.queryKey,
              },
              'Query error'
            )
          },
        }),
        mutationCache: new MutationCache({
          onError: (error, _variables, _context, mutation) => {
            log.error(
              {
                error: error instanceof Error ? error.message : String(error),
                mutationKey: mutation.options.mutationKey,
              },
              'Mutation error'
            )
          },
        }),
      })
  )

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}
