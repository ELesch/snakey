'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useLiveQuery } from 'dexie-react-hooks'
import { offlineDb, type OfflineShed } from '@/lib/offline/db'
import { useOnlineStatus } from './use-online-status'
import {
  fetchSheds,
  createShed,
  updateShed,
  deleteShed,
} from '@/lib/api/shed.api'
import { ApiClientError } from '@/lib/api/utils'
import type { Shed } from '@/generated/prisma/client'
import type { ShedCreate, ShedUpdate, ShedQuery } from '@/validations/shed'
import { generateId } from '@/lib/id'

// Query keys for cache management
export const shedKeys = {
  all: ['sheds'] as const,
  lists: () => [...shedKeys.all, 'list'] as const,
  list: (reptileId: string, filters: Partial<ShedQuery> = {}) =>
    [...shedKeys.lists(), reptileId, filters] as const,
  details: () => [...shedKeys.all, 'detail'] as const,
  detail: (reptileId: string, shedId: string) =>
    [...shedKeys.details(), reptileId, shedId] as const,
}

// Convert API Shed to Offline format
function toOfflineShed(shed: Shed, syncStatus: 'synced' | 'pending' = 'synced'): OfflineShed {
  return {
    id: shed.id,
    reptileId: shed.reptileId,
    startDate: shed.startDate ? new Date(shed.startDate).getTime() : undefined,
    completedDate: new Date(shed.completedDate).getTime(),
    quality: shed.quality,
    isComplete: shed.isComplete,
    issues: shed.issues ?? undefined,
    notes: shed.notes ?? undefined,
    createdAt: new Date(shed.createdAt).getTime(),
    updatedAt: new Date(shed.updatedAt).getTime(),
    _syncStatus: syncStatus,
    _lastModified: Date.now(),
  }
}

/**
 * Hook for fetching sheds with offline support
 */
export function useSheds(reptileId: string, query: Partial<ShedQuery> = {}) {
  const isOnline = useOnlineStatus()

  // Offline data from Dexie
  const offlineSheds = useLiveQuery(
    () => offlineDb.sheds
      .where('reptileId')
      .equals(reptileId)
      .reverse()
      .sortBy('completedDate'),
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
    queryKey: shedKeys.list(reptileId, query),
    queryFn: async () => {
      const result = await fetchSheds(reptileId, query)
      // Sync to offline DB
      const offlineRecords = result.data.map((s) => toOfflineShed(s))
      await offlineDb.sheds.bulkPut(offlineRecords)
      return result
    },
    enabled: isOnline && !!reptileId,
    staleTime: 30 * 1000,
  })

  const sheds = isOnline && apiData ? apiData.data : (offlineSheds ?? [])
  const meta = apiData?.meta

  return {
    sheds: sheds as (Shed | OfflineShed)[],
    meta,
    isPending: isOnline ? isPending : offlineSheds === undefined,
    isError,
    error: error as ApiClientError | null,
    isOnline,
    isOfflineData: !isOnline || !apiData,
    refetch,
  }
}

/**
 * Hook for creating a shed with optimistic updates
 */
export function useCreateShed(reptileId: string) {
  const queryClient = useQueryClient()
  const isOnline = useOnlineStatus()

  return useMutation({
    mutationFn: async (data: ShedCreate) => {
      if (!isOnline) {
        const offlineId = data.id ?? generateId()
        const offlineShed: OfflineShed = {
          id: offlineId,
          reptileId,
          startDate: data.startDate ? new Date(data.startDate).getTime() : undefined,
          completedDate: new Date(data.completedDate).getTime(),
          quality: data.quality,
          isComplete: data.isComplete ?? true,
          issues: data.issues ?? undefined,
          notes: data.notes ?? undefined,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          _syncStatus: 'pending',
          _lastModified: Date.now(),
        }
        await offlineDb.sheds.add(offlineShed)
        await offlineDb.syncQueue.add({
          operation: 'CREATE',
          table: 'sheds',
          recordId: offlineId,
          payload: { reptileId, ...data },
          status: 'PENDING',
          retryCount: 0,
          createdAt: Date.now(),
        })
        return offlineShed as unknown as Shed
      }
      return createShed(reptileId, data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: shedKeys.lists() })
    },
  })
}

/**
 * Hook for updating a shed
 */
export function useUpdateShed(reptileId: string) {
  const queryClient = useQueryClient()
  const isOnline = useOnlineStatus()

  return useMutation({
    mutationFn: async ({ shedId, data }: { shedId: string; data: ShedUpdate }) => {
      if (!isOnline) {
        const updateData: Partial<OfflineShed> = {
          updatedAt: Date.now(),
          _syncStatus: 'pending',
          _lastModified: Date.now(),
        }
        if (data.startDate !== undefined) {
          updateData.startDate = data.startDate ? new Date(data.startDate).getTime() : undefined
        }
        if (data.completedDate !== undefined) {
          updateData.completedDate = new Date(data.completedDate).getTime()
        }
        if (data.quality !== undefined) updateData.quality = data.quality
        if (data.isComplete !== undefined) updateData.isComplete = data.isComplete
        if (data.issues !== undefined) updateData.issues = data.issues ?? undefined
        if (data.notes !== undefined) updateData.notes = data.notes ?? undefined

        await offlineDb.sheds.update(shedId, updateData)
        await offlineDb.syncQueue.add({
          operation: 'UPDATE',
          table: 'sheds',
          recordId: shedId,
          payload: data,
          status: 'PENDING',
          retryCount: 0,
          createdAt: Date.now(),
        })
        return await offlineDb.sheds.get(shedId) as unknown as Shed
      }
      return updateShed(reptileId, shedId, data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: shedKeys.lists() })
    },
  })
}

/**
 * Hook for deleting a shed
 */
export function useDeleteShed(reptileId: string) {
  const queryClient = useQueryClient()
  const isOnline = useOnlineStatus()

  return useMutation({
    mutationFn: async (shedId: string) => {
      if (!isOnline) {
        await offlineDb.sheds.delete(shedId)
        await offlineDb.syncQueue.add({
          operation: 'DELETE',
          table: 'sheds',
          recordId: shedId,
          payload: null,
          status: 'PENDING',
          retryCount: 0,
          createdAt: Date.now(),
        })
        return { id: shedId, deletedAt: new Date().toISOString() }
      }
      return deleteShed(reptileId, shedId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: shedKeys.lists() })
    },
  })
}
