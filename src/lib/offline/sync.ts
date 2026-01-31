// Background Sync Logic
import { offlineDb } from './db'
import {
  getPendingOperations,
  markSyncing,
  markSynced,
  markFailed,
} from './queue'
import { logger } from '../logger'

const log = logger.child({ context: 'OfflineSync' })

// API endpoint for sync
const SYNC_API_BASE = '/api/sync'

/**
 * Sync a single operation to the server
 */
async function syncOperation(item: {
  id: number
  operation: string
  table: string
  recordId: string
  payload: unknown
}): Promise<void> {
  const response = await fetch(`${SYNC_API_BASE}/${item.table}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      operation: item.operation,
      recordId: item.recordId,
      payload: item.payload,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(error || `HTTP ${response.status}`)
  }
}

/**
 * Process all pending sync operations
 */
export async function syncPendingChanges(): Promise<{
  synced: number
  failed: number
}> {
  const pending = await getPendingOperations()

  if (pending.length === 0) {
    return { synced: 0, failed: 0 }
  }

  log.info({ count: pending.length }, 'Starting sync of pending operations')

  let synced = 0
  let failed = 0

  for (const item of pending) {
    if (!item.id) continue

    try {
      await markSyncing(item.id)
      await syncOperation({
        id: item.id,
        operation: item.operation,
        table: item.table,
        recordId: item.recordId,
        payload: item.payload,
      })
      await markSynced(item.id)

      // Update the local record's sync status
      await updateLocalSyncStatus(item.table, item.recordId, 'synced')

      synced++
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      log.error({ error: errorMessage, item }, 'Failed to sync operation')
      await markFailed(item.id, errorMessage)
      failed++
    }
  }

  log.info({ synced, failed }, 'Sync completed')

  // Update last sync timestamp
  await offlineDb.lastSync.put({
    table: '_all',
    timestamp: Date.now(),
  })

  return { synced, failed }
}

/**
 * Update the sync status of a local record
 */
async function updateLocalSyncStatus(
  table: string,
  recordId: string,
  status: 'synced' | 'pending' | 'failed'
): Promise<void> {
  const tableMap: Record<string, unknown> = {
    reptiles: offlineDb.reptiles,
    feedings: offlineDb.feedings,
    sheds: offlineDb.sheds,
    weights: offlineDb.weights,
    environmentLogs: offlineDb.environmentLogs,
    photos: offlineDb.photos,
  }

  const dbTable = tableMap[table]
  if (dbTable && typeof dbTable === 'object' && 'update' in dbTable) {
    await (dbTable as { update: (id: string, changes: object) => Promise<void> }).update(
      recordId,
      { _syncStatus: status, _lastModified: Date.now() }
    )
  }
}

/**
 * Calculate backoff delay for retries (exponential)
 */
export function calculateBackoff(retryCount: number): number {
  const baseDelay = 1000 // 1 second
  const maxDelay = 60000 // 60 seconds
  const delay = Math.min(baseDelay * Math.pow(2, retryCount), maxDelay)
  // Add jitter
  return delay + Math.random() * 1000
}

/**
 * Check if we're online
 */
export function isOnline(): boolean {
  return typeof navigator !== 'undefined' ? navigator.onLine : true
}

/**
 * Start background sync interval
 */
export function startBackgroundSync(intervalMs: number = 30000): () => void {
  let timeoutId: NodeJS.Timeout | null = null

  const sync = async () => {
    if (isOnline()) {
      try {
        await syncPendingChanges()
      } catch (error) {
        log.error({ error }, 'Background sync error')
      }
    }
    timeoutId = setTimeout(sync, intervalMs)
  }

  // Start immediately
  sync()

  // Return cleanup function
  return () => {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }
  }
}
