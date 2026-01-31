'use client'

import { useState, useEffect, useCallback } from 'react'
import { getPendingCount, getFailedOperations } from '@/lib/offline/queue'
import { getLastPullTimestamp } from '@/lib/offline/sync'

export interface SyncStatus {
  isOnline: boolean
  isSyncing: boolean
  pendingCount: number
  failedCount: number
  lastSync: number
  hasPendingChanges: boolean
  hasFailedChanges: boolean
}

/**
 * Hook for tracking sync status without context dependency
 * Use this for components outside the SyncProvider
 */
export function useSyncStatus(): SyncStatus & {
  refresh: () => Promise<void>
  setIsSyncing: (value: boolean) => void
} {
  const [isOnline, setIsOnline] = useState(true)
  const [isSyncing, setIsSyncing] = useState(false)
  const [pendingCount, setPendingCount] = useState(0)
  const [failedCount, setFailedCount] = useState(0)
  const [lastSync, setLastSync] = useState(0)

  const refresh = useCallback(async () => {
    try {
      const [pending, failed, lastPull] = await Promise.all([
        getPendingCount(),
        getFailedOperations(),
        getLastPullTimestamp(),
      ])
      setPendingCount(pending)
      setFailedCount(failed.length)
      setLastSync(lastPull)
    } catch (error) {
      console.error('Failed to get sync status:', error)
    }
  }, [])

  // Track online status
  useEffect(() => {
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

  // Poll for changes
  useEffect(() => {
    refresh()
    const interval = setInterval(refresh, 5000)
    return () => clearInterval(interval)
  }, [refresh])

  return {
    isOnline,
    isSyncing,
    pendingCount,
    failedCount,
    lastSync,
    hasPendingChanges: pendingCount > 0,
    hasFailedChanges: failedCount > 0,
    refresh,
    setIsSyncing,
  }
}
