'use client'

import { useEffect, useState } from 'react'
import { WifiOff, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'

export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(true)
  const [pendingCount, setPendingCount] = useState(0)

  useEffect(() => {
    // Set initial state
    setIsOnline(navigator.onLine)

    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // TODO: Subscribe to pending count from offline sync queue

  if (isOnline && pendingCount === 0) {
    return null
  }

  return (
    <div
      className={cn(
        'fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-auto',
        'flex items-center gap-2 rounded-lg px-4 py-2 shadow-lg',
        isOnline ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'
      )}
    >
      {!isOnline ? (
        <>
          <WifiOff className="h-4 w-4" />
          <span className="text-sm font-medium">You&apos;re offline</span>
          <span className="text-sm">Changes will sync when connected</span>
        </>
      ) : pendingCount > 0 ? (
        <>
          <RefreshCw className="h-4 w-4 animate-spin" />
          <span className="text-sm font-medium">Syncing {pendingCount} changes...</span>
        </>
      ) : null}
    </div>
  )
}
