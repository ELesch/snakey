'use client'

import { useEffect } from 'react'
import { registerServiceWorker } from '@/lib/pwa/register'
import { startBackgroundSync } from '@/lib/offline/sync'
import { InstallPrompt } from '@/components/pwa/install-prompt'
import { ServiceWorkerUpdatePrompt } from '@/components/pwa/sw-update-prompt'

interface PWAProviderProps {
  children: React.ReactNode
}

export function PWAProvider({ children }: PWAProviderProps) {
  useEffect(() => {
    // Register service worker
    registerServiceWorker()

    // Start background sync for offline changes
    const cleanup = startBackgroundSync()

    return cleanup
  }, [])

  return (
    <>
      {children}
      <InstallPrompt />
      <ServiceWorkerUpdatePrompt />
    </>
  )
}
