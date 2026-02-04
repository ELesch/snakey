// Utility functions for offline sync
import { offlineDb } from './db'

/**
 * Update the sync status of a local record
 */
export async function updateLocalSyncStatus(
  table: string,
  recordId: string,
  status: 'synced' | 'pending' | 'failed'
): Promise<void> {
  const tableMap: Record<string, unknown> = {
    reptiles: offlineDb.reptiles,
    feedings: offlineDb.feedings,
    sheds: offlineDb.sheds,
    measurements: offlineDb.measurements,
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
 * Calculate backoff delay for retries (exponential with jitter)
 */
export function calculateBackoff(retryCount: number): number {
  const baseDelay = 1000 // 1 second
  const maxDelay = 60000 // 60 seconds
  const delay = Math.min(baseDelay * Math.pow(2, retryCount), maxDelay)
  return delay + Math.random() * 1000
}

/**
 * Check if we're online
 */
export function isOnline(): boolean {
  return typeof navigator !== 'undefined' ? navigator.onLine : true
}
