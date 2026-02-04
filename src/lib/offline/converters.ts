// Converter functions for server records to offline format
import type {
  OfflineReptile,
  OfflineFeeding,
  OfflineShed,
  OfflineMeasurement,
  OfflineEnvironmentLog,
} from './db'

// Type for server sync records
export interface SyncRecord {
  id: string
  updatedAt: string
  deletedAt?: string | null
  [key: string]: unknown
}

export function toOfflineReptile(record: SyncRecord): OfflineReptile {
  return {
    id: record.id,
    userId: record.userId as string,
    name: record.name as string,
    species: record.species as string,
    morph: record.morph as string | undefined,
    sex: record.sex as 'MALE' | 'FEMALE' | 'UNKNOWN',
    birthDate: record.birthDate ? new Date(record.birthDate as string).getTime() : undefined,
    acquisitionDate: new Date(record.acquisitionDate as string).getTime(),
    notes: record.notes as string | undefined,
    isPublic: record.isPublic as boolean,
    shareId: record.shareId as string | undefined,
    createdAt: new Date(record.createdAt as string).getTime(),
    updatedAt: new Date(record.updatedAt).getTime(),
    deletedAt: record.deletedAt ? new Date(record.deletedAt).getTime() : undefined,
    _syncStatus: 'synced',
    _lastModified: Date.now(),
  }
}

export function toOfflineFeeding(record: SyncRecord): OfflineFeeding {
  return {
    id: record.id,
    reptileId: record.reptileId as string,
    date: new Date(record.date as string).getTime(),
    preyType: record.preyType as string,
    preySize: record.preySize as string,
    preySource: record.preySource as 'LIVE' | 'FROZEN_THAWED' | 'PRE_KILLED',
    accepted: record.accepted as boolean,
    refused: record.refused as boolean,
    regurgitated: record.regurgitated as boolean,
    notes: record.notes as string | undefined,
    createdAt: new Date(record.createdAt as string).getTime(),
    updatedAt: new Date(record.updatedAt).getTime(),
    _syncStatus: 'synced',
    _lastModified: Date.now(),
  }
}

export function toOfflineShed(record: SyncRecord): OfflineShed {
  return {
    id: record.id,
    reptileId: record.reptileId as string,
    startDate: record.startDate ? new Date(record.startDate as string).getTime() : undefined,
    completedDate: new Date(record.completedDate as string).getTime(),
    quality: record.quality as 'COMPLETE' | 'PARTIAL' | 'PROBLEMATIC',
    isComplete: record.isComplete as boolean,
    issues: record.issues as string | undefined,
    notes: record.notes as string | undefined,
    createdAt: new Date(record.createdAt as string).getTime(),
    updatedAt: new Date(record.updatedAt).getTime(),
    _syncStatus: 'synced',
    _lastModified: Date.now(),
  }
}

export function toOfflineMeasurement(record: SyncRecord): OfflineMeasurement {
  return {
    id: record.id,
    reptileId: record.reptileId as string,
    date: new Date(record.date as string).getTime(),
    type: record.type as OfflineMeasurement['type'],
    value: record.value as number,
    unit: record.unit as string,
    notes: record.notes as string | undefined,
    createdAt: new Date(record.createdAt as string).getTime(),
    updatedAt: new Date(record.updatedAt).getTime(),
    _syncStatus: 'synced',
    _lastModified: Date.now(),
  }
}

export function toOfflineEnvironmentLog(record: SyncRecord): OfflineEnvironmentLog {
  return {
    id: record.id,
    reptileId: record.reptileId as string,
    date: new Date(record.date as string).getTime(),
    temperature: record.temperature as number | undefined,
    humidity: record.humidity as number | undefined,
    location: record.location as string | undefined,
    notes: record.notes as string | undefined,
    isAlert: record.isAlert as boolean,
    createdAt: new Date(record.createdAt as string).getTime(),
    _syncStatus: 'synced',
    _lastModified: Date.now(),
  }
}
