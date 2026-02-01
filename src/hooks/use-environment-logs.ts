'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useLiveQuery } from 'dexie-react-hooks'
import { offlineDb, type OfflineEnvironmentLog } from '@/lib/offline/db'
import { useOnlineStatus } from './use-online-status'
import {
  fetchEnvironmentLogs,
  createEnvironmentLog,
  updateEnvironmentLog,
  deleteEnvironmentLog,
} from '@/lib/api/environment.api'
import { ApiClientError } from '@/lib/api/utils'
import type { EnvironmentLog } from '@/generated/prisma/client'
import type { EnvironmentCreate, EnvironmentUpdate, EnvironmentQuery } from '@/validations/environment'

// Query keys for cache management
export const environmentKeys = {
  all: ['environmentLogs'] as const,
  lists: () => [...environmentKeys.all, 'list'] as const,
  list: (reptileId: string, filters: Partial<EnvironmentQuery> = {}) =>
    [...environmentKeys.lists(), reptileId, filters] as const,
  details: () => [...environmentKeys.all, 'detail'] as const,
  detail: (reptileId: string, logId: string) =>
    [...environmentKeys.details(), reptileId, logId] as const,
}

// Convert API EnvironmentLog to Offline format
function toOfflineEnvironmentLog(
  log: EnvironmentLog,
  syncStatus: 'synced' | 'pending' = 'synced'
): OfflineEnvironmentLog {
  return {
    id: log.id,
    reptileId: log.reptileId,
    date: new Date(log.date).getTime(),
    temperature: log.temperature ? Number(log.temperature) : undefined,
    humidity: log.humidity ? Number(log.humidity) : undefined,
    location: log.location ?? undefined,
    notes: log.notes ?? undefined,
    isAlert: log.isAlert,
    createdAt: new Date(log.createdAt).getTime(),
    _syncStatus: syncStatus,
    _lastModified: Date.now(),
  }
}

/**
 * Hook for fetching environment logs with offline support
 */
export function useEnvironmentLogs(reptileId: string, query: Partial<EnvironmentQuery> = {}) {
  const isOnline = useOnlineStatus()

  // Offline data from Dexie
  const offlineLogs = useLiveQuery(
    () => offlineDb.environmentLogs
      .where('reptileId')
      .equals(reptileId)
      .reverse()
      .limit(query.limit ?? 50)
      .sortBy('date'),
    [reptileId, query.limit]
  )

  // Online data from API
  const {
    data: apiData,
    isPending,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: environmentKeys.list(reptileId, query),
    queryFn: async () => {
      const result = await fetchEnvironmentLogs(reptileId, query)
      // Sync to offline DB
      const offlineRecords = result.data.map((l) => toOfflineEnvironmentLog(l))
      await offlineDb.environmentLogs.bulkPut(offlineRecords)
      return result
    },
    enabled: isOnline && !!reptileId,
    staleTime: 30 * 1000,
  })

  const logs = isOnline && apiData ? apiData.data : (offlineLogs ?? [])
  const meta = apiData?.meta

  return {
    logs: logs as (EnvironmentLog | OfflineEnvironmentLog)[],
    meta,
    isPending: isOnline ? isPending : offlineLogs === undefined,
    isError,
    error: error as ApiClientError | null,
    isOnline,
    isOfflineData: !isOnline || !apiData,
    refetch,
  }
}

/**
 * Hook for creating an environment log with optimistic updates
 */
export function useCreateEnvironmentLog(reptileId: string) {
  const queryClient = useQueryClient()
  const isOnline = useOnlineStatus()

  return useMutation({
    mutationFn: async (data: EnvironmentCreate) => {
      if (!isOnline) {
        const offlineId = data.id ?? crypto.randomUUID()
        const offlineLog: OfflineEnvironmentLog = {
          id: offlineId,
          reptileId,
          date: new Date(data.date).getTime(),
          temperature: data.temperature ?? undefined,
          humidity: data.humidity ?? undefined,
          location: data.location ?? undefined,
          notes: data.notes ?? undefined,
          isAlert: false,
          createdAt: Date.now(),
          _syncStatus: 'pending',
          _lastModified: Date.now(),
        }
        await offlineDb.environmentLogs.add(offlineLog)
        await offlineDb.syncQueue.add({
          operation: 'CREATE',
          table: 'environmentLogs',
          recordId: offlineId,
          payload: { reptileId, ...data },
          status: 'PENDING',
          retryCount: 0,
          createdAt: Date.now(),
        })
        return offlineLog as unknown as EnvironmentLog
      }
      return createEnvironmentLog(reptileId, data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: environmentKeys.lists() })
    },
  })
}

/**
 * Hook for updating an environment log
 */
export function useUpdateEnvironmentLog(reptileId: string) {
  const queryClient = useQueryClient()
  const isOnline = useOnlineStatus()

  return useMutation({
    mutationFn: async ({ logId, data }: { logId: string; data: EnvironmentUpdate }) => {
      if (!isOnline) {
        const updateData: Partial<OfflineEnvironmentLog> = {
          _syncStatus: 'pending',
          _lastModified: Date.now(),
        }
        if (data.date !== undefined) updateData.date = new Date(data.date).getTime()
        if (data.temperature !== undefined) updateData.temperature = data.temperature ?? undefined
        if (data.humidity !== undefined) updateData.humidity = data.humidity ?? undefined
        if (data.location !== undefined) updateData.location = data.location ?? undefined
        if (data.notes !== undefined) updateData.notes = data.notes ?? undefined

        await offlineDb.environmentLogs.update(logId, updateData)
        await offlineDb.syncQueue.add({
          operation: 'UPDATE',
          table: 'environmentLogs',
          recordId: logId,
          payload: data,
          status: 'PENDING',
          retryCount: 0,
          createdAt: Date.now(),
        })
        return await offlineDb.environmentLogs.get(logId) as unknown as EnvironmentLog
      }
      return updateEnvironmentLog(reptileId, logId, data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: environmentKeys.lists() })
    },
  })
}

/**
 * Hook for deleting an environment log
 */
export function useDeleteEnvironmentLog(reptileId: string) {
  const queryClient = useQueryClient()
  const isOnline = useOnlineStatus()

  return useMutation({
    mutationFn: async (logId: string) => {
      if (!isOnline) {
        await offlineDb.environmentLogs.delete(logId)
        await offlineDb.syncQueue.add({
          operation: 'DELETE',
          table: 'environmentLogs',
          recordId: logId,
          payload: null,
          status: 'PENDING',
          retryCount: 0,
          createdAt: Date.now(),
        })
        return { id: logId, deletedAt: new Date().toISOString() }
      }
      return deleteEnvironmentLog(reptileId, logId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: environmentKeys.lists() })
    },
  })
}
