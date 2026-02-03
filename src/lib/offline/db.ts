// Dexie IndexedDB Database for Offline Support
import Dexie, { type Table } from 'dexie'

// Sync status for offline records
type SyncStatus = 'synced' | 'pending' | 'failed'

// Base interface for synced entities
interface SyncedEntity {
  id: string
  _syncStatus: SyncStatus
  _lastModified: number
}

// Offline versions of Prisma models
export interface OfflineReptile extends SyncedEntity {
  userId: string
  name: string
  species: string
  morph?: string
  sex: 'MALE' | 'FEMALE' | 'UNKNOWN'
  birthDate?: number // Store as timestamp
  acquisitionDate: number
  currentWeight?: number
  notes?: string
  isPublic: boolean
  shareId?: string
  createdAt: number
  updatedAt: number
  deletedAt?: number
}

export interface OfflineFeeding extends SyncedEntity {
  reptileId: string
  date: number
  preyType: string
  preySize: string
  preySource: 'LIVE' | 'FROZEN_THAWED' | 'PRE_KILLED'
  accepted: boolean
  refused: boolean
  regurgitated: boolean
  notes?: string
  createdAt: number
  updatedAt: number
}

export interface OfflineShed extends SyncedEntity {
  reptileId: string
  startDate?: number
  completedDate: number
  quality: 'COMPLETE' | 'PARTIAL' | 'PROBLEMATIC'
  isComplete: boolean
  issues?: string
  notes?: string
  createdAt: number
  updatedAt: number
}

export interface OfflineWeight extends SyncedEntity {
  reptileId: string
  date: number
  weight: number
  notes?: string
  createdAt: number
  updatedAt: number
}

export interface OfflineEnvironmentLog extends SyncedEntity {
  reptileId: string
  date: number
  temperature?: number
  humidity?: number
  location?: string
  notes?: string
  isAlert: boolean
  createdAt: number
}

export interface OfflinePhoto extends SyncedEntity {
  reptileId: string
  storagePath?: string
  thumbnailPath?: string
  imageData?: string  // Base64 encoded image data
  caption?: string
  takenAt: number
  category: 'GENERAL' | 'MORPH' | 'SHED' | 'VET' | 'ENCLOSURE'
  createdAt: number
  // For offline, we also store the blob
  blob?: Blob
}

export interface SyncQueueItem {
  id?: number
  operation: 'CREATE' | 'UPDATE' | 'DELETE'
  table: string
  recordId: string
  payload: unknown
  status: 'PENDING' | 'SYNCING' | 'SYNCED' | 'FAILED'
  retryCount: number
  error?: string
  createdAt: number
}

export interface LastSync {
  table: string
  timestamp: number
}

// Dexie Database Definition
export class SnakeyDB extends Dexie {
  reptiles!: Table<OfflineReptile>
  feedings!: Table<OfflineFeeding>
  sheds!: Table<OfflineShed>
  weights!: Table<OfflineWeight>
  environmentLogs!: Table<OfflineEnvironmentLog>
  photos!: Table<OfflinePhoto>
  syncQueue!: Table<SyncQueueItem>
  lastSync!: Table<LastSync>

  constructor() {
    super('snakey')

    this.version(1).stores({
      reptiles: 'id, userId, species, _syncStatus',
      feedings: 'id, reptileId, date, _syncStatus',
      sheds: 'id, reptileId, completedDate, _syncStatus',
      weights: 'id, reptileId, date, _syncStatus',
      environmentLogs: 'id, reptileId, date, _syncStatus',
      photos: 'id, reptileId, takenAt, _syncStatus',
      syncQueue: '++id, table, status, createdAt',
      lastSync: 'table',
    })
  }
}

// Singleton instance
export const offlineDb = new SnakeyDB()

export default offlineDb
