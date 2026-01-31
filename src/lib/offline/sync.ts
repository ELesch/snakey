// Background Sync Logic - Push pending changes to server
import { offlineDb } from './db'
import { getPendingOperations, markSyncing, markSynced, markFailed } from './queue'
import { pullServerData, getLastPullTimestamp } from './pull'
import { updateLocalSyncStatus, calculateBackoff, isOnline } from './utils'
import { logger } from '../logger'

const log = logger.child({ context: 'OfflineSync' })
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
    headers: { 'Content-Type': 'application/json' },
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
 * Process all pending sync operations (push)
 */
export async function syncPendingChanges(): Promise<{ synced: number; failed: number }> {
  const pending = await getPendingOperations()
  if (pending.length === 0) return { synced: 0, failed: 0 }

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
  await offlineDb.lastSync.put({ table: '_all', timestamp: Date.now() })

  return { synced, failed }
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

  sync()
  return () => { if (timeoutId) clearTimeout(timeoutId) }
}

/**
 * Full sync - push pending changes then pull server updates
 */
export async function performFullSync(): Promise<{
  pushed: { synced: number; failed: number }
  pulled: boolean
}> {
  const pushed = await syncPendingChanges()

  let pulled = false
  try {
    const lastPull = await getLastPullTimestamp()
    await pullServerData(lastPull)
    pulled = true
  } catch (error) {
    log.error({ error }, 'Pull sync failed during full sync')
  }

  return { pushed, pulled }
}

// Re-export for convenience
export { pullServerData, performInitialSync, getLastPullTimestamp } from './pull'
export { calculateBackoff, isOnline } from './utils'
