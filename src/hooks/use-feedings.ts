'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useLiveQuery } from 'dexie-react-hooks'
import { offlineDb, type OfflineFeeding } from '@/lib/offline/db'
import { useOnlineStatus } from './use-online-status'
import {
  fetchFeedings,
  createFeeding,
  updateFeeding,
  deleteFeeding,
  FeedingApiError,
} from '@/lib/api/feeding.api'
import type { Feeding } from '@/generated/prisma/client'
import type { FeedingCreate, FeedingUpdate, FeedingQuery } from '@/validations/feeding'

// Query keys for cache management
export const feedingKeys = {
  all: ['feedings'] as const,
  lists: () => [...feedingKeys.all, 'list'] as const,
  list: (reptileId: string, filters: Partial<FeedingQuery> = {}) =>
    [...feedingKeys.lists(), reptileId, filters] as const,
  details: () => [...feedingKeys.all, 'detail'] as const,
  detail: (reptileId: string, feedingId: string) =>
    [...feedingKeys.details(), reptileId, feedingId] as const,
}

// Convert API Feeding to Offline format
function toOfflineFeeding(feeding: Feeding, syncStatus: 'synced' | 'pending' = 'synced'): OfflineFeeding {
  return {
    id: feeding.id,
    reptileId: feeding.reptileId,
    date: new Date(feeding.date).getTime(),
    preyType: feeding.preyType,
    preySize: feeding.preySize,
    preySource: feeding.preySource,
    accepted: feeding.accepted,
    refused: feeding.refused,
    regurgitated: feeding.regurgitated,
    notes: feeding.notes ?? undefined,
    createdAt: new Date(feeding.createdAt).getTime(),
    updatedAt: new Date(feeding.updatedAt).getTime(),
    _syncStatus: syncStatus,
    _lastModified: Date.now(),
  }
}

/**
 * Hook for fetching feedings with offline support
 */
export function useFeedings(reptileId: string, query: Partial<FeedingQuery> = {}) {
  const isOnline = useOnlineStatus()

  // Offline data from Dexie
  const offlineFeedings = useLiveQuery(
    () => offlineDb.feedings
      .where('reptileId')
      .equals(reptileId)
      .reverse()
      .sortBy('date'),
    [reptileId]
  )

  // Online data from API
  const {
    data: apiData,
    isPending,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: feedingKeys.list(reptileId, query),
    queryFn: async () => {
      const result = await fetchFeedings(reptileId, query)
      // Sync to offline DB
      const offlineRecords = result.data.map((f) => toOfflineFeeding(f))
      await offlineDb.feedings.bulkPut(offlineRecords)
      return result
    },
    enabled: isOnline && !!reptileId,
    staleTime: 30 * 1000,
  })

  const feedings = isOnline && apiData ? apiData.data : (offlineFeedings ?? [])
  const meta = apiData?.meta

  return {
    feedings: feedings as (Feeding | OfflineFeeding)[],
    meta,
    isPending: isOnline ? isPending : offlineFeedings === undefined,
    isError,
    error: error as FeedingApiError | null,
    isOnline,
    isOfflineData: !isOnline || !apiData,
    refetch,
  }
}

/**
 * Hook for creating a feeding with optimistic updates
 */
export function useCreateFeeding(reptileId: string) {
  const queryClient = useQueryClient()
  const isOnline = useOnlineStatus()

  return useMutation({
    mutationFn: async (data: FeedingCreate) => {
      if (!isOnline) {
        const offlineId = data.id ?? crypto.randomUUID()
        const offlineFeeding: OfflineFeeding = {
          id: offlineId,
          reptileId,
          date: new Date(data.date).getTime(),
          preyType: data.preyType,
          preySize: data.preySize,
          preySource: data.preySource,
          accepted: data.accepted,
          refused: data.refused ?? false,
          regurgitated: data.regurgitated ?? false,
          notes: data.notes ?? undefined,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          _syncStatus: 'pending',
          _lastModified: Date.now(),
        }
        await offlineDb.feedings.add(offlineFeeding)
        await offlineDb.syncQueue.add({
          operation: 'CREATE',
          table: 'feedings',
          recordId: offlineId,
          payload: { reptileId, ...data },
          status: 'PENDING',
          retryCount: 0,
          createdAt: Date.now(),
        })
        return offlineFeeding as unknown as Feeding
      }
      return createFeeding(reptileId, data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: feedingKeys.lists() })
    },
  })
}

/**
 * Hook for updating a feeding
 */
export function useUpdateFeeding(reptileId: string) {
  const queryClient = useQueryClient()
  const isOnline = useOnlineStatus()

  return useMutation({
    mutationFn: async ({ feedingId, data }: { feedingId: string; data: FeedingUpdate }) => {
      if (!isOnline) {
        const updateData: Partial<OfflineFeeding> = {
          updatedAt: Date.now(),
          _syncStatus: 'pending',
          _lastModified: Date.now(),
        }
        if (data.date !== undefined) updateData.date = new Date(data.date).getTime()
        if (data.preyType !== undefined) updateData.preyType = data.preyType
        if (data.preySize !== undefined) updateData.preySize = data.preySize
        if (data.preySource !== undefined) updateData.preySource = data.preySource
        if (data.accepted !== undefined) updateData.accepted = data.accepted
        if (data.refused !== undefined) updateData.refused = data.refused
        if (data.regurgitated !== undefined) updateData.regurgitated = data.regurgitated
        if (data.notes !== undefined) updateData.notes = data.notes ?? undefined

        await offlineDb.feedings.update(feedingId, updateData)
        await offlineDb.syncQueue.add({
          operation: 'UPDATE',
          table: 'feedings',
          recordId: feedingId,
          payload: data,
          status: 'PENDING',
          retryCount: 0,
          createdAt: Date.now(),
        })
        return await offlineDb.feedings.get(feedingId) as unknown as Feeding
      }
      return updateFeeding(reptileId, feedingId, data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: feedingKeys.lists() })
    },
  })
}

/**
 * Hook for deleting a feeding
 */
export function useDeleteFeeding(reptileId: string) {
  const queryClient = useQueryClient()
  const isOnline = useOnlineStatus()

  return useMutation({
    mutationFn: async (feedingId: string) => {
      if (!isOnline) {
        await offlineDb.feedings.delete(feedingId)
        await offlineDb.syncQueue.add({
          operation: 'DELETE',
          table: 'feedings',
          recordId: feedingId,
          payload: null,
          status: 'PENDING',
          retryCount: 0,
          createdAt: Date.now(),
        })
        return { id: feedingId, deletedAt: new Date().toISOString() }
      }
      return deleteFeeding(reptileId, feedingId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: feedingKeys.lists() })
    },
  })
}
