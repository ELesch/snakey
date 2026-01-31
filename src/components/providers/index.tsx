'use client'

import { PWAProvider } from './pwa-provider'

interface ProvidersProps {
  children: React.ReactNode
}

export function Providers({ children }: ProvidersProps) {
  return (
    <PWAProvider>
      {children}
    </PWAProvider>
  )
}
