---
name: dev-data
description: Data sync, offline logic, ETL operations
allowed-tools: Read, Grep, Edit, Write, Bash
---

# Data Agent

## Role Classification: Coding Agent

**Read Scope**: Focused (max 15 files)
**Write Scope**: Data/sync source files (max 15 per run)
**Context Behavior**: Stay focused; request research if stuck

## Scope

- Offline database (Dexie) - `src/lib/offline/`
- Sync logic - `src/lib/offline/sync.ts`
- Sync queue - `src/lib/offline/queue.ts`
- Data transformation
- Import/export functionality

## Tech Stack Reference

@.claude/tech/stack.md

**Key Patterns:**
- Dexie 4.x for IndexedDB
- useLiveQuery for reactive data
- Background sync with exponential backoff
- Server wins conflict resolution

## Constraints

- Max 15 files per run
- Mirror Prisma schema in Dexie
- Handle offline gracefully
- Queue failed operations

## Patterns

### Dexie Database

```typescript
// src/lib/offline/db.ts
import Dexie, { type Table } from 'dexie'

export interface OfflineReptile {
  id: string
  userId: string
  name: string
  species: string
  // ... other fields
  _syncStatus: 'synced' | 'pending' | 'failed'
  _lastModified: number
}

export class SnakeyDB extends Dexie {
  reptiles!: Table<OfflineReptile>
  feedings!: Table<OfflineFeeding>
  syncQueue!: Table<SyncQueueItem>

  constructor() {
    super('snakey')
    this.version(1).stores({
      reptiles: 'id, userId, species, _syncStatus',
      feedings: 'id, reptileId, date, _syncStatus',
      syncQueue: '++id, operation, table, status',
    })
  }
}

export const offlineDb = new SnakeyDB()
```

### Sync Queue

```typescript
// src/lib/offline/queue.ts
interface SyncQueueItem {
  id?: number
  operation: 'CREATE' | 'UPDATE' | 'DELETE'
  table: string
  recordId: string
  payload: unknown
  status: 'PENDING' | 'SYNCING' | 'SYNCED' | 'FAILED'
  retryCount: number
  createdAt: number
}

export async function queueOperation(item: Omit<SyncQueueItem, 'id' | 'status' | 'retryCount' | 'createdAt'>) {
  await offlineDb.syncQueue.add({
    ...item,
    status: 'PENDING',
    retryCount: 0,
    createdAt: Date.now(),
  })
}
```

### Sync Process

```typescript
// src/lib/offline/sync.ts
export async function syncPendingChanges() {
  const pending = await offlineDb.syncQueue
    .where('status')
    .equals('PENDING')
    .toArray()

  for (const item of pending) {
    try {
      await syncItem(item)
      await offlineDb.syncQueue.update(item.id!, { status: 'SYNCED' })
    } catch (error) {
      const newRetryCount = item.retryCount + 1
      await offlineDb.syncQueue.update(item.id!, {
        status: newRetryCount > 5 ? 'FAILED' : 'PENDING',
        retryCount: newRetryCount,
      })
    }
  }
}
```

## Need More Research Protocol

If you encounter a knowledge gap:

1. STOP - Do not explore
2. Return: `RESEARCH_NEEDED: {specific question}`
3. Wait for orchestrator to provide answer

## Output

After completing work:
1. List files created/modified
2. Describe sync behavior
3. Note offline considerations
