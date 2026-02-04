// Pull Sync - Fetch server data and apply to IndexedDB
import { offlineDb } from './db'
import { logger } from '../logger'
import {
  type SyncRecord,
  toOfflineReptile,
  toOfflineFeeding,
  toOfflineShed,
  toOfflineWeight,
  toOfflineEnvironmentLog,
} from './converters'

const log = logger.child({ context: 'PullSync' })

// API endpoint for sync
const SYNC_API_BASE = '/api/sync'

// Response type for pull sync
interface PullResponse {
  reptiles: SyncRecord[]
  feedings: SyncRecord[]
  sheds: SyncRecord[]
  weights: SyncRecord[]
  environmentLogs: SyncRecord[]
  serverTimestamp: number
}

/**
 * Check if we're online
 */
function isOnline(): boolean {
  return typeof navigator !== 'undefined' ? navigator.onLine : true
}

/**
 * Pull server data since last sync timestamp
 */
export async function pullServerData(lastSyncTimestamp: number): Promise<void> {
  if (!isOnline()) {
    log.debug('Offline, skipping pull sync')
    return
  }

  log.info({ lastSyncTimestamp }, 'Pulling server data')

  const response = await fetch(`${SYNC_API_BASE}/pull?since=${lastSyncTimestamp}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  })

  if (!response.ok) {
    throw new Error(`Pull sync failed: HTTP ${response.status}`)
  }

  const data: PullResponse = await response.json()
  await applyServerChanges(data)

  // Update last sync timestamp
  await offlineDb.lastSync.put({
    table: '_pull',
    timestamp: data.serverTimestamp,
  })

  log.info({ serverTimestamp: data.serverTimestamp }, 'Pull sync completed')
}

/**
 * Apply server changes to local IndexedDB (server wins).
 * Uses bulk operations for better performance.
 */
async function applyServerChanges(data: PullResponse): Promise<void> {
  // Process reptiles
  const reptilesToUpsert = data.reptiles.filter(r => !r.deletedAt).map(toOfflineReptile)
  const reptileIdsToDelete = data.reptiles.filter(r => r.deletedAt).map(r => r.id)
  if (reptilesToUpsert.length > 0) {
    await offlineDb.reptiles.bulkPut(reptilesToUpsert)
  }
  if (reptileIdsToDelete.length > 0) {
    await offlineDb.reptiles.bulkDelete(reptileIdsToDelete)
  }

  // Process feedings
  const feedingsToUpsert = data.feedings.filter(r => !r.deletedAt).map(toOfflineFeeding)
  const feedingIdsToDelete = data.feedings.filter(r => r.deletedAt).map(r => r.id)
  if (feedingsToUpsert.length > 0) {
    await offlineDb.feedings.bulkPut(feedingsToUpsert)
  }
  if (feedingIdsToDelete.length > 0) {
    await offlineDb.feedings.bulkDelete(feedingIdsToDelete)
  }

  // Process sheds
  const shedsToUpsert = data.sheds.filter(r => !r.deletedAt).map(toOfflineShed)
  const shedIdsToDelete = data.sheds.filter(r => r.deletedAt).map(r => r.id)
  if (shedsToUpsert.length > 0) {
    await offlineDb.sheds.bulkPut(shedsToUpsert)
  }
  if (shedIdsToDelete.length > 0) {
    await offlineDb.sheds.bulkDelete(shedIdsToDelete)
  }

  // Process weights
  const weightsToUpsert = data.weights.filter(r => !r.deletedAt).map(toOfflineWeight)
  const weightIdsToDelete = data.weights.filter(r => r.deletedAt).map(r => r.id)
  if (weightsToUpsert.length > 0) {
    await offlineDb.weights.bulkPut(weightsToUpsert)
  }
  if (weightIdsToDelete.length > 0) {
    await offlineDb.weights.bulkDelete(weightIdsToDelete)
  }

  // Process environmentLogs
  const envLogsToUpsert = data.environmentLogs.filter(r => !r.deletedAt).map(toOfflineEnvironmentLog)
  const envLogIdsToDelete = data.environmentLogs.filter(r => r.deletedAt).map(r => r.id)
  if (envLogsToUpsert.length > 0) {
    await offlineDb.environmentLogs.bulkPut(envLogsToUpsert)
  }
  if (envLogIdsToDelete.length > 0) {
    await offlineDb.environmentLogs.bulkDelete(envLogIdsToDelete)
  }
}


/**
 * Perform initial sync - full data pull on first load or login
 */
export async function performInitialSync(): Promise<void> {
  if (!isOnline()) {
    log.debug('Offline, skipping initial sync')
    return
  }

  log.info('Starting initial sync')
  await pullServerData(0)
  log.info('Initial sync completed')
}

/**
 * Get the last pull sync timestamp
 */
export async function getLastPullTimestamp(): Promise<number> {
  const record = await offlineDb.lastSync.get('_pull')
  return record?.timestamp ?? 0
}
