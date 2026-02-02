'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useLiveQuery } from 'dexie-react-hooks'
import { offlineDb, type OfflineReptile } from '@/lib/offline/db'
import { useOnlineStatus } from './use-online-status'
import {
  fetchReptiles,
  fetchReptile,
  createReptile,
  updateReptile,
  deleteReptile,
} from '@/lib/api/reptile.api'
import { ApiClientError } from '@/lib/api/utils'
import type { Reptile } from '@/generated/prisma/client'
import type { ReptileCreate, ReptileUpdate, ReptileQuery } from '@/validations/reptile'
import { generateId } from '@/lib/id'

// Query keys for cache management
export const reptileKeys = {
  all: ['reptiles'] as const,
  lists: () => [...reptileKeys.all, 'list'] as const,
  list: (filters: Partial<ReptileQuery>) =>
    [...reptileKeys.lists(), filters] as const,
  details: () => [...reptileKeys.all, 'detail'] as const,
  detail: (id: string) => [...reptileKeys.details(), id] as const,
}

// Convert API Reptile to Offline format
function toOfflineReptile(reptile: Reptile, syncStatus: 'synced' | 'pending' = 'synced'): OfflineReptile {
  return {
    id: reptile.id,
    userId: reptile.userId,
    name: reptile.name,
    species: reptile.species,
    morph: reptile.morph ?? undefined,
    sex: reptile.sex,
    birthDate: reptile.birthDate ? new Date(reptile.birthDate).getTime() : undefined,
    acquisitionDate: new Date(reptile.acquisitionDate).getTime(),
    currentWeight: reptile.currentWeight ? Number(reptile.currentWeight) : undefined,
    notes: reptile.notes ?? undefined,
    isPublic: reptile.isPublic,
    shareId: reptile.shareId ?? undefined,
    createdAt: new Date(reptile.createdAt).getTime(),
    updatedAt: new Date(reptile.updatedAt).getTime(),
    deletedAt: reptile.deletedAt ? new Date(reptile.deletedAt).getTime() : undefined,
    _syncStatus: syncStatus,
    _lastModified: Date.now(),
  }
}

/**
 * Hook for fetching all reptiles with offline support
 */
export function useReptiles(query: Partial<ReptileQuery> = {}) {
  const isOnline = useOnlineStatus()
  const queryClient = useQueryClient()

  // Offline data from Dexie
  const offlineReptiles = useLiveQuery(
    () =>
      offlineDb.reptiles
        .filter((r) => !r.deletedAt)
        .toArray(),
    []
  )

  // Online data from API
  const {
    data: apiData,
    isPending,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: reptileKeys.list(query),
    queryFn: async () => {
      const result = await fetchReptiles(query)
      // Sync to offline DB for future offline access
      await syncToOfflineDb(result.data)
      return result
    },
    enabled: isOnline,
    staleTime: 30 * 1000, // 30 seconds
  })

  // Sync API data to offline DB
  async function syncToOfflineDb(reptiles: Reptile[]) {
    const offlineRecords = reptiles.map((r) => toOfflineReptile(r))
    await offlineDb.reptiles.bulkPut(offlineRecords)
  }

  // Determine which data to use
  // Priority: API data (fast, cached by TanStack Query) > Dexie data (slow on mobile)
  const reptiles = apiData?.data ?? offlineReptiles ?? []
  const meta = apiData?.meta

  // CRITICAL FIX FOR MOBILE PERFORMANCE:
  // Don't wait for Dexie (IndexedDB) when online - it's slow on mobile (200-500ms)
  // TanStack Query caches API data across navigations, so use that for loading state
  // Only wait for Dexie when offline (no other option)
  const isLoading = isOnline
    ? isPending && !apiData  // Online: only wait for API (TanStack cache is fast)
    : offlineReptiles === undefined  // Offline: must wait for Dexie

  return {
    reptiles: reptiles as (Reptile | OfflineReptile)[],
    meta,
    isPending: isLoading,
    isError,
    error: error as ApiClientError | null,
    isOnline,
    isOfflineData: !isOnline || !apiData,
    // Background refresh: have data but still fetching
    isRefreshing: !isLoading && isPending,
    refetch,
  }
}

/**
 * Hook for fetching a single reptile with offline support
 */
export function useReptile(
  id: string,
  options: {
    include?: string[]
    enabled?: boolean
  } = {}
) {
  const { include, enabled = true } = options
  const isOnline = useOnlineStatus()

  // Offline data from Dexie
  const offlineReptile = useLiveQuery(
    () => offlineDb.reptiles.get(id),
    [id]
  )

  // Online data from API
  const {
    data: reptile,
    isPending,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: reptileKeys.detail(id),
    queryFn: async () => {
      const result = await fetchReptile(id, { include })
      // Sync to offline DB
      await offlineDb.reptiles.put(toOfflineReptile(result))
      return result
    },
    enabled: enabled && isOnline,
    staleTime: 30 * 1000,
  })

  // Determine which data to use
  // Priority: API data (fast, cached by TanStack Query) > Dexie data (slow on mobile)
  const data = reptile ?? offlineReptile

  // CRITICAL FIX FOR MOBILE PERFORMANCE:
  // Don't wait for Dexie (IndexedDB) when online - it's slow on mobile (200-500ms)
  // TanStack Query caches API data across navigations, so use that for loading state
  // Only wait for Dexie when offline (no other option)
  const isLoading = isOnline
    ? isPending && !reptile  // Online: only wait for API (TanStack cache is fast)
    : offlineReptile === undefined  // Offline: must wait for Dexie

  return {
    reptile: data as Reptile | OfflineReptile | undefined,
    isPending: isLoading,
    isError,
    error: error as ApiClientError | null,
    isOnline,
    isOfflineData: !isOnline || !reptile,
    // Background refresh: have data but still fetching
    isRefreshing: !isLoading && isPending,
    refetch,
  }
}

/**
 * Hook for creating a reptile with optimistic updates
 */
export function useCreateReptile() {
  const queryClient = useQueryClient()
  const isOnline = useOnlineStatus()

  return useMutation({
    mutationFn: async (data: ReptileCreate) => {
      if (!isOnline) {
        // Create offline record
        const offlineId = generateId()
        const offlineReptile: OfflineReptile = {
          id: offlineId,
          userId: '', // Will be set by server
          name: data.name,
          species: data.species,
          morph: data.morph ?? undefined,
          sex: data.sex ?? 'UNKNOWN',
          birthDate: data.birthDate ? new Date(data.birthDate).getTime() : undefined,
          acquisitionDate: new Date(data.acquisitionDate).getTime(),
          currentWeight: data.currentWeight ?? undefined,
          notes: data.notes ?? undefined,
          isPublic: data.isPublic ?? false,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          _syncStatus: 'pending',
          _lastModified: Date.now(),
        }
        await offlineDb.reptiles.add(offlineReptile)
        // Add to sync queue
        await offlineDb.syncQueue.add({
          operation: 'CREATE',
          table: 'reptiles',
          recordId: offlineId,
          payload: data,
          status: 'PENDING',
          retryCount: 0,
          createdAt: Date.now(),
        })
        return offlineReptile as unknown as Reptile
      }
      return createReptile(data)
    },
    onSuccess: (newReptile) => {
      // Invalidate and refetch reptiles list
      queryClient.invalidateQueries({ queryKey: reptileKeys.lists() })
      // Add to cache
      queryClient.setQueryData(reptileKeys.detail(newReptile.id), newReptile)
    },
  })
}

/**
 * Hook for updating a reptile with optimistic updates
 */
export function useUpdateReptile() {
  const queryClient = useQueryClient()
  const isOnline = useOnlineStatus()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: ReptileUpdate }) => {
      if (!isOnline) {
        // Update offline record - convert null values to undefined for Dexie
        const updateData: Partial<OfflineReptile> = {
          updatedAt: Date.now(),
          _syncStatus: 'pending',
          _lastModified: Date.now(),
        }
        if (data.name !== undefined) updateData.name = data.name
        if (data.species !== undefined) updateData.species = data.species
        if (data.morph !== undefined) updateData.morph = data.morph ?? undefined
        if (data.sex !== undefined) updateData.sex = data.sex
        if (data.notes !== undefined) updateData.notes = data.notes ?? undefined
        if (data.isPublic !== undefined) updateData.isPublic = data.isPublic
        if (data.birthDate !== undefined) {
          updateData.birthDate = data.birthDate ? new Date(data.birthDate).getTime() : undefined
        }
        if (data.acquisitionDate !== undefined) {
          updateData.acquisitionDate = new Date(data.acquisitionDate).getTime()
        }
        if (data.currentWeight !== undefined) {
          updateData.currentWeight = data.currentWeight ?? undefined
        }

        await offlineDb.reptiles.update(id, updateData)
        // Add to sync queue
        await offlineDb.syncQueue.add({
          operation: 'UPDATE',
          table: 'reptiles',
          recordId: id,
          payload: data,
          status: 'PENDING',
          retryCount: 0,
          createdAt: Date.now(),
        })
        const updated = await offlineDb.reptiles.get(id)
        return updated as unknown as Reptile
      }
      return updateReptile(id, data)
    },
    onMutate: async ({ id, data }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: reptileKeys.detail(id) })

      // Snapshot previous value
      const previousReptile = queryClient.getQueryData(reptileKeys.detail(id))

      // Optimistically update cache
      queryClient.setQueryData(reptileKeys.detail(id), (old: Reptile | undefined) =>
        old ? { ...old, ...data, updatedAt: new Date() } : old
      )

      return { previousReptile }
    },
    onError: (err, { id }, context) => {
      // Rollback on error
      if (context?.previousReptile) {
        queryClient.setQueryData(reptileKeys.detail(id), context.previousReptile)
      }
    },
    onSettled: (_, __, { id }) => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: reptileKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: reptileKeys.lists() })
    },
  })
}

/**
 * Hook for deleting a reptile
 */
export function useDeleteReptile() {
  const queryClient = useQueryClient()
  const isOnline = useOnlineStatus()

  return useMutation({
    mutationFn: async (id: string) => {
      if (!isOnline) {
        // Soft delete offline
        await offlineDb.reptiles.update(id, {
          deletedAt: Date.now(),
          _syncStatus: 'pending',
          _lastModified: Date.now(),
        })
        // Add to sync queue
        await offlineDb.syncQueue.add({
          operation: 'DELETE',
          table: 'reptiles',
          recordId: id,
          payload: null,
          status: 'PENDING',
          retryCount: 0,
          createdAt: Date.now(),
        })
        return { id, deletedAt: new Date().toISOString() }
      }
      return deleteReptile(id)
    },
    onMutate: async (id) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: reptileKeys.lists() })

      // Snapshot previous list
      const previousReptiles = queryClient.getQueryData(reptileKeys.lists())

      return { previousReptiles }
    },
    onError: (err, id, context) => {
      // Could implement rollback here if needed
    },
    onSettled: () => {
      // Refetch lists
      queryClient.invalidateQueries({ queryKey: reptileKeys.lists() })
    },
  })
}
