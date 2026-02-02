'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useLiveQuery } from 'dexie-react-hooks'
import { offlineDb, type OfflineWeight } from '@/lib/offline/db'
import { useOnlineStatus } from './use-online-status'
import {
  fetchWeights,
  createWeight,
  updateWeight,
  deleteWeight,
} from '@/lib/api/weight.api'
import { ApiClientError } from '@/lib/api/utils'
import type { Weight } from '@/generated/prisma/client'
import type { WeightCreate, WeightUpdate, WeightQuery } from '@/validations/weight'
import { generateId } from '@/lib/id'

// Query keys for cache management
export const weightKeys = {
  all: ['weights'] as const,
  lists: () => [...weightKeys.all, 'list'] as const,
  list: (reptileId: string, filters: Partial<WeightQuery> = {}) =>
    [...weightKeys.lists(), reptileId, filters] as const,
  details: () => [...weightKeys.all, 'detail'] as const,
  detail: (reptileId: string, weightId: string) =>
    [...weightKeys.details(), reptileId, weightId] as const,
}

// Convert API Weight to Offline format
function toOfflineWeight(weight: Weight, syncStatus: 'synced' | 'pending' = 'synced'): OfflineWeight {
  return {
    id: weight.id,
    reptileId: weight.reptileId,
    date: new Date(weight.date).getTime(),
    weight: Number(weight.weight),
    notes: weight.notes ?? undefined,
    createdAt: new Date(weight.createdAt).getTime(),
    updatedAt: new Date(weight.updatedAt).getTime(),
    _syncStatus: syncStatus,
    _lastModified: Date.now(),
  }
}

/**
 * Hook for fetching weights with offline support
 */
export function useWeights(reptileId: string, query: Partial<WeightQuery> = {}) {
  const isOnline = useOnlineStatus()

  // Offline data from Dexie
  const offlineWeights = useLiveQuery(
    () => offlineDb.weights
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
    queryKey: weightKeys.list(reptileId, query),
    queryFn: async () => {
      const result = await fetchWeights(reptileId, query)
      // Sync to offline DB
      const offlineRecords = result.data.map((w) => toOfflineWeight(w))
      await offlineDb.weights.bulkPut(offlineRecords)
      return result
    },
    enabled: isOnline && !!reptileId,
    staleTime: 30 * 1000,
  })

  const weights = isOnline && apiData ? apiData.data : (offlineWeights ?? [])
  const meta = apiData?.meta

  return {
    weights: weights as (Weight | OfflineWeight)[],
    meta,
    isPending: isOnline ? isPending : offlineWeights === undefined,
    isError,
    error: error as ApiClientError | null,
    isOnline,
    isOfflineData: !isOnline || !apiData,
    refetch,
  }
}

/**
 * Hook for creating a weight with optimistic updates
 */
export function useCreateWeight(reptileId: string) {
  const queryClient = useQueryClient()
  const isOnline = useOnlineStatus()

  return useMutation({
    mutationFn: async (data: WeightCreate) => {
      if (!isOnline) {
        const offlineId = data.id ?? generateId()
        const offlineWeight: OfflineWeight = {
          id: offlineId,
          reptileId,
          date: new Date(data.date).getTime(),
          weight: data.weight,
          notes: data.notes ?? undefined,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          _syncStatus: 'pending',
          _lastModified: Date.now(),
        }
        await offlineDb.weights.add(offlineWeight)
        await offlineDb.syncQueue.add({
          operation: 'CREATE',
          table: 'weights',
          recordId: offlineId,
          payload: { reptileId, ...data },
          status: 'PENDING',
          retryCount: 0,
          createdAt: Date.now(),
        })
        return offlineWeight as unknown as Weight
      }
      return createWeight(reptileId, data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: weightKeys.lists() })
    },
  })
}

/**
 * Hook for updating a weight
 */
export function useUpdateWeight(reptileId: string) {
  const queryClient = useQueryClient()
  const isOnline = useOnlineStatus()

  return useMutation({
    mutationFn: async ({ weightId, data }: { weightId: string; data: WeightUpdate }) => {
      if (!isOnline) {
        const updateData: Partial<OfflineWeight> = {
          updatedAt: Date.now(),
          _syncStatus: 'pending',
          _lastModified: Date.now(),
        }
        if (data.date !== undefined) updateData.date = new Date(data.date).getTime()
        if (data.weight !== undefined) updateData.weight = data.weight
        if (data.notes !== undefined) updateData.notes = data.notes ?? undefined

        await offlineDb.weights.update(weightId, updateData)
        await offlineDb.syncQueue.add({
          operation: 'UPDATE',
          table: 'weights',
          recordId: weightId,
          payload: data,
          status: 'PENDING',
          retryCount: 0,
          createdAt: Date.now(),
        })
        return await offlineDb.weights.get(weightId) as unknown as Weight
      }
      return updateWeight(reptileId, weightId, data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: weightKeys.lists() })
    },
  })
}

/**
 * Hook for deleting a weight
 */
export function useDeleteWeight(reptileId: string) {
  const queryClient = useQueryClient()
  const isOnline = useOnlineStatus()

  return useMutation({
    mutationFn: async (weightId: string) => {
      if (!isOnline) {
        await offlineDb.weights.delete(weightId)
        await offlineDb.syncQueue.add({
          operation: 'DELETE',
          table: 'weights',
          recordId: weightId,
          payload: null,
          status: 'PENDING',
          retryCount: 0,
          createdAt: Date.now(),
        })
        return { id: weightId, deletedAt: new Date().toISOString() }
      }
      return deleteWeight(reptileId, weightId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: weightKeys.lists() })
    },
  })
}
