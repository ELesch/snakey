'use client'

import { WifiOff, RefreshCw, AlertCircle, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useSyncStatus } from '@/hooks/use-sync-status'
import { retryFailedOperations } from '@/lib/offline/queue'
import { performFullSync } from '@/lib/offline/sync'
import { useState } from 'react'

export function OfflineIndicator() {
  const {
    isOnline,
    isSyncing,
    pendingCount,
    failedCount,
    setIsSyncing,
  } = useSyncStatus()

  const [isRetrying, setIsRetrying] = useState(false)

  const handleRetry = async () => {
    if (isRetrying || isSyncing) return

    setIsRetrying(true)
    setIsSyncing(true)

    try {
      await retryFailedOperations()
      await performFullSync()
    } catch (error) {
      console.error('Retry failed:', error)
    } finally {
      setIsRetrying(false)
      setIsSyncing(false)
    }
  }

  const handleManualSync = async () => {
    if (isSyncing || !isOnline) return

    setIsSyncing(true)
    try {
      await performFullSync()
    } catch (error) {
      console.error('Manual sync failed:', error)
    } finally {
      setIsSyncing(false)
    }
  }

  // Hide when fully synced and online
  if (isOnline && pendingCount === 0 && failedCount === 0 && !isSyncing) {
    return null
  }

  return (
    <div
      className={cn(
        'fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-auto z-50',
        'flex items-center gap-3 rounded-lg px-4 py-2 shadow-lg',
        !isOnline
          ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
          : failedCount > 0
            ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300'
            : 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'
      )}
    >
      {!isOnline ? (
        <>
          <WifiOff className="h-4 w-4 shrink-0" />
          <div className="flex flex-col">
            <span className="text-sm font-medium">You are offline</span>
            {pendingCount > 0 && (
              <span className="text-xs opacity-80">
                {pendingCount} change{pendingCount !== 1 ? 's' : ''} waiting to sync
              </span>
            )}
          </div>
        </>
      ) : failedCount > 0 ? (
        <>
          <AlertCircle className="h-4 w-4 shrink-0" />
          <div className="flex flex-col">
            <span className="text-sm font-medium">
              {failedCount} sync failure{failedCount !== 1 ? 's' : ''}
            </span>
            <span className="text-xs opacity-80">
              Some changes could not be synced
            </span>
          </div>
          <button
            onClick={handleRetry}
            disabled={isRetrying}
            className={cn(
              'ml-2 rounded-md px-2 py-1 text-xs font-medium',
              'bg-orange-200 hover:bg-orange-300',
              'dark:bg-orange-800 dark:hover:bg-orange-700',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'transition-colors'
            )}
          >
            {isRetrying ? 'Retrying...' : 'Retry'}
          </button>
        </>
      ) : isSyncing ? (
        <>
          <RefreshCw className="h-4 w-4 shrink-0 animate-spin" />
          <span className="text-sm font-medium">
            Syncing{pendingCount > 0 ? ` ${pendingCount} change${pendingCount !== 1 ? 's' : ''}` : ''}...
          </span>
        </>
      ) : pendingCount > 0 ? (
        <>
          <RefreshCw className="h-4 w-4 shrink-0" />
          <span className="text-sm font-medium">
            {pendingCount} pending change{pendingCount !== 1 ? 's' : ''}
          </span>
          <button
            onClick={handleManualSync}
            className={cn(
              'ml-2 rounded-md px-2 py-1 text-xs font-medium',
              'bg-amber-200 hover:bg-amber-300',
              'dark:bg-amber-800 dark:hover:bg-amber-700',
              'transition-colors'
            )}
          >
            Sync Now
          </button>
        </>
      ) : (
        <>
          <Check className="h-4 w-4 shrink-0" />
          <span className="text-sm font-medium">All synced</span>
        </>
      )}
    </div>
  )
}
