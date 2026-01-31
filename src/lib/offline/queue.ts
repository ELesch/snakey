// Sync Queue Management for Offline Operations
import { offlineDb, type SyncQueueItem } from './db'

/**
 * Add an operation to the sync queue
 */
export async function queueOperation(
  operation: 'CREATE' | 'UPDATE' | 'DELETE',
  table: string,
  recordId: string,
  payload: unknown
): Promise<void> {
  await offlineDb.syncQueue.add({
    operation,
    table,
    recordId,
    payload,
    status: 'PENDING',
    retryCount: 0,
    createdAt: Date.now(),
  })
}

/**
 * Get pending operations from the queue
 */
export async function getPendingOperations(): Promise<SyncQueueItem[]> {
  return offlineDb.syncQueue.where('status').equals('PENDING').toArray()
}

/**
 * Get failed operations from the queue
 */
export async function getFailedOperations(): Promise<SyncQueueItem[]> {
  return offlineDb.syncQueue.where('status').equals('FAILED').toArray()
}

/**
 * Mark an operation as syncing
 */
export async function markSyncing(id: number): Promise<void> {
  await offlineDb.syncQueue.update(id, { status: 'SYNCING' })
}

/**
 * Mark an operation as synced (and optionally remove it)
 */
export async function markSynced(id: number, remove: boolean = true): Promise<void> {
  if (remove) {
    await offlineDb.syncQueue.delete(id)
  } else {
    await offlineDb.syncQueue.update(id, { status: 'SYNCED' })
  }
}

/**
 * Mark an operation as failed
 */
export async function markFailed(
  id: number,
  error: string,
  maxRetries: number = 5
): Promise<void> {
  const item = await offlineDb.syncQueue.get(id)
  if (!item) return

  const newRetryCount = item.retryCount + 1
  await offlineDb.syncQueue.update(id, {
    status: newRetryCount >= maxRetries ? 'FAILED' : 'PENDING',
    retryCount: newRetryCount,
    error,
  })
}

/**
 * Get the count of pending operations
 */
export async function getPendingCount(): Promise<number> {
  return offlineDb.syncQueue.where('status').equals('PENDING').count()
}

/**
 * Clear all synced operations
 */
export async function clearSyncedOperations(): Promise<void> {
  await offlineDb.syncQueue.where('status').equals('SYNCED').delete()
}

/**
 * Clear all operations for a specific table
 */
export async function clearTableOperations(table: string): Promise<void> {
  await offlineDb.syncQueue.where('table').equals(table).delete()
}

/**
 * Retry all failed operations
 */
export async function retryFailedOperations(): Promise<void> {
  await offlineDb.syncQueue
    .where('status')
    .equals('FAILED')
    .modify({ status: 'PENDING', retryCount: 0, error: undefined })
}
