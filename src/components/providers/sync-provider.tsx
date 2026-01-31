'use client'

import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import type { ReactNode } from 'react'
import { getPendingCount, retryFailedOperations } from '@/lib/offline/queue'
import { performFullSync, getLastPullTimestamp, calculateBackoff, isOnline as checkOnline } from '@/lib/offline/sync'
import { logger } from '@/lib/logger'

const log = logger.child({ context: 'SyncProvider' })

interface SyncState {
  isOnline: boolean
  isSyncing: boolean
  pendingCount: number
  lastSyncTimestamp: number
  syncError: string | null
}

interface SyncContextValue extends SyncState {
  triggerSync: () => Promise<void>
  retryFailed: () => Promise<void>
  refresh: () => Promise<void>
}

const SyncContext = createContext<SyncContextValue | null>(null)

export function SyncProvider({ children, syncIntervalMs = 30000 }: { children: ReactNode; syncIntervalMs?: number }) {
  const [state, setState] = useState<SyncState>({
    isOnline: true,
    isSyncing: false,
    pendingCount: 0,
    lastSyncTimestamp: 0,
    syncError: null,
  })

  const retryCountRef = useRef(0)
  const syncIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const refresh = useCallback(async () => {
    try {
      const [count, lastPull] = await Promise.all([getPendingCount(), getLastPullTimestamp()])
      setState((prev) => ({ ...prev, pendingCount: count, lastSyncTimestamp: lastPull }))
    } catch (error) {
      log.error({ error }, 'Failed to refresh sync state')
    }
  }, [])

  const triggerSync = useCallback(async () => {
    if (!checkOnline() || state.isSyncing) return

    setState((prev) => ({ ...prev, isSyncing: true, syncError: null }))

    try {
      const result = await performFullSync()
      retryCountRef.current = 0
      log.info({ pushed: result.pushed, pulled: result.pulled }, 'Sync completed')
      await refresh()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Sync failed'
      log.error({ error }, 'Sync failed')
      retryCountRef.current++
      setState((prev) => ({ ...prev, syncError: message }))

      if (retryCountRef.current < 5) {
        setTimeout(triggerSync, calculateBackoff(retryCountRef.current))
      }
    } finally {
      setState((prev) => ({ ...prev, isSyncing: false }))
    }
  }, [state.isSyncing, refresh])

  const retryFailed = useCallback(async () => {
    try {
      await retryFailedOperations()
      await triggerSync()
    } catch (error) {
      log.error({ error }, 'Failed to retry operations')
    }
  }, [triggerSync])

  useEffect(() => {
    setState((prev) => ({ ...prev, isOnline: navigator.onLine }))

    const handleOnline = () => {
      setState((prev) => ({ ...prev, isOnline: true }))
      triggerSync()
    }
    const handleOffline = () => setState((prev) => ({ ...prev, isOnline: false }))

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [triggerSync])

  useEffect(() => {
    refresh()
    if (checkOnline()) triggerSync()

    syncIntervalRef.current = setInterval(() => {
      if (checkOnline() && !state.isSyncing) triggerSync()
    }, syncIntervalMs)

    return () => { if (syncIntervalRef.current) clearInterval(syncIntervalRef.current) }
  }, [syncIntervalMs]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <SyncContext.Provider value={{ ...state, triggerSync, retryFailed, refresh }}>
      {children}
    </SyncContext.Provider>
  )
}

export function useSyncContext(): SyncContextValue {
  const context = useContext(SyncContext)
  if (!context) throw new Error('useSyncContext must be used within a SyncProvider')
  return context
}
