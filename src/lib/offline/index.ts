// Offline-First Data Layer
// Exports for IndexedDB database, sync queue, and sync logic

export { offlineDb, SnakeyDB } from './db'
export type {
  OfflineReptile,
  OfflineFeeding,
  OfflineShed,
  OfflineMeasurement,
  OfflineEnvironmentLog,
  OfflinePhoto,
  SyncQueueItem,
  LastSync,
} from './db'

export {
  queueOperation,
  getPendingOperations,
  getFailedOperations,
  markSyncing,
  markSynced,
  markFailed,
  getPendingCount,
  clearSyncedOperations,
  clearTableOperations,
  retryFailedOperations,
} from './queue'

export {
  syncPendingChanges,
  startBackgroundSync,
  pullServerData,
  performInitialSync,
  getLastPullTimestamp,
  performFullSync,
} from './sync'

export {
  updateLocalSyncStatus,
  calculateBackoff,
  isOnline,
} from './utils'

export type { SyncRecord } from './converters'
export {
  toOfflineReptile,
  toOfflineFeeding,
  toOfflineShed,
  toOfflineMeasurement,
  toOfflineEnvironmentLog,
} from './converters'
