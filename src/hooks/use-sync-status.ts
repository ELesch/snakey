'use client'

import { useState, useEffect, useCallback } from 'react'
import { getPendingCount } from '@/lib/offline/queue'

export function useSyncStatus() {
  const [pendingCount, setPendingCount] = useState(0)
  const [isSyncing, setIsSyncing] = useState(false)

  const refresh = useCallback(async () => {
    try {
      const count = await getPendingCount()
      setPendingCount(count)
    } catch (error) {
      console.error('Failed to get pending count:', error)
    }
  }, [])

  useEffect(() => {
    refresh()

    // Poll for changes every 5 seconds
    const interval = setInterval(refresh, 5000)

    return () => clearInterval(interval)
  }, [refresh])

  return {
    pendingCount,
    isSyncing,
    setIsSyncing,
    refresh,
    hasPendingChanges: pendingCount > 0,
  }
}
