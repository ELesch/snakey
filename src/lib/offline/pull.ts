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
 * Apply server changes to local IndexedDB (server wins)
 */
async function applyServerChanges(data: PullResponse): Promise<void> {
  for (const record of data.reptiles) {
    await upsertOrDeleteRecord('reptiles', record, toOfflineReptile)
  }

  for (const record of data.feedings) {
    await upsertOrDeleteRecord('feedings', record, toOfflineFeeding)
  }

  for (const record of data.sheds) {
    await upsertOrDeleteRecord('sheds', record, toOfflineShed)
  }

  for (const record of data.weights) {
    await upsertOrDeleteRecord('weights', record, toOfflineWeight)
  }

  for (const record of data.environmentLogs) {
    await upsertOrDeleteRecord('environmentLogs', record, toOfflineEnvironmentLog)
  }
}

/**
 * Upsert or delete a record based on server data
 */
async function upsertOrDeleteRecord<T extends { id: string }>(
  table: keyof typeof offlineDb,
  record: SyncRecord,
  converter: (record: SyncRecord) => T
): Promise<void> {
  const dbTable = offlineDb[table] as import('dexie').Table<T, string>

  if (record.deletedAt) {
    await dbTable.delete(record.id)
  } else {
    const converted = converter(record)
    await dbTable.put(converted)
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
