'use client'

import { PWAProvider } from './pwa-provider'
import { QueryProvider } from './query-provider'
import { SyncProvider } from './sync-provider'

interface ProvidersProps {
  children: React.ReactNode
}

export function Providers({ children }: ProvidersProps) {
  return (
    <QueryProvider>
      <SyncProvider>
        <PWAProvider>{children}</PWAProvider>
      </SyncProvider>
    </QueryProvider>
  )
}

export { SyncProvider, useSyncContext } from './sync-provider'
