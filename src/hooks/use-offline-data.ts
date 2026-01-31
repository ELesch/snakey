'use client'

import { useLiveQuery } from 'dexie-react-hooks'
import { offlineDb } from '@/lib/offline/db'
import { useOnlineStatus } from './use-online-status'

/**
 * Hook for accessing reptiles with offline support
 */
export function useReptiles() {
  const isOnline = useOnlineStatus()

  // Use Dexie's live query for reactive offline data
  const reptiles = useLiveQuery(
    () => offlineDb.reptiles.where('isActive').equals(1).toArray(),
    []
  )

  return {
    reptiles: reptiles || [],
    isLoading: reptiles === undefined,
    isOnline,
  }
}

/**
 * Hook for accessing a single reptile
 */
export function useReptile(id: string) {
  const isOnline = useOnlineStatus()

  const reptile = useLiveQuery(
    () => offlineDb.reptiles.get(id),
    [id]
  )

  return {
    reptile,
    isLoading: reptile === undefined,
    isOnline,
  }
}

/**
 * Hook for accessing feedings for a reptile
 */
export function useFeedings(reptileId: string) {
  const feedings = useLiveQuery(
    () => offlineDb.feedings
      .where('reptileId')
      .equals(reptileId)
      .reverse()
      .sortBy('date'),
    [reptileId]
  )

  return {
    feedings: feedings || [],
    isLoading: feedings === undefined,
  }
}

/**
 * Hook for accessing sheds for a reptile
 */
export function useSheds(reptileId: string) {
  const sheds = useLiveQuery(
    () => offlineDb.sheds
      .where('reptileId')
      .equals(reptileId)
      .reverse()
      .sortBy('date'),
    [reptileId]
  )

  return {
    sheds: sheds || [],
    isLoading: sheds === undefined,
  }
}

/**
 * Hook for accessing weights for a reptile
 */
export function useWeights(reptileId: string) {
  const weights = useLiveQuery(
    () => offlineDb.weights
      .where('reptileId')
      .equals(reptileId)
      .reverse()
      .sortBy('date'),
    [reptileId]
  )

  return {
    weights: weights || [],
    isLoading: weights === undefined,
  }
}

/**
 * Hook for accessing environment logs for a reptile
 */
export function useEnvironmentLogs(reptileId: string, limit = 50) {
  const logs = useLiveQuery(
    () => offlineDb.environmentLogs
      .where('reptileId')
      .equals(reptileId)
      .reverse()
      .limit(limit)
      .sortBy('timestamp'),
    [reptileId, limit]
  )

  return {
    logs: logs || [],
    isLoading: logs === undefined,
  }
}
