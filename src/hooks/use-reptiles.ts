'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
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

// Query keys for cache management
export const reptileKeys = {
  all: ['reptiles'] as const,
  lists: () => [...reptileKeys.all, 'list'] as const,
  list: (filters: Partial<ReptileQuery>) =>
    [...reptileKeys.lists(), filters] as const,
  details: () => [...reptileKeys.all, 'detail'] as const,
  detail: (id: string) => [...reptileKeys.details(), id] as const,
}

/**
 * Hook for fetching all reptiles
 * Used by components that still need client-side data (tracker, reports, breeding)
 */
export function useReptiles(query: Partial<ReptileQuery> = {}) {
  const {
    data: apiData,
    isPending,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: reptileKeys.list(query),
    queryFn: async () => {
      return fetchReptiles(query)
    },
    staleTime: 30 * 1000, // 30 seconds
  })

  return {
    reptiles: apiData?.data ?? [],
    meta: apiData?.meta,
    isPending,
    isError,
    error: error as ApiClientError | null,
    refetch,
  }
}

/**
 * Hook for fetching a single reptile
 * Used by components that still need client-side data (mobile-nav)
 */
export function useReptile(
  id: string,
  options: {
    include?: string[]
    enabled?: boolean
  } = {}
) {
  const { include, enabled = true } = options

  const {
    data: reptile,
    isPending,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: reptileKeys.detail(id),
    queryFn: async () => {
      return fetchReptile(id, { include })
    },
    enabled: enabled && !!id,
    staleTime: 30 * 1000,
  })

  return {
    reptile,
    isPending,
    isError,
    error: error as ApiClientError | null,
    refetch,
  }
}

/**
 * Hook for creating a reptile
 */
export function useCreateReptile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: ReptileCreate) => {
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

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: ReptileUpdate }) => {
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

  return useMutation({
    mutationFn: async (id: string) => {
      return deleteReptile(id)
    },
    onMutate: async () => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: reptileKeys.lists() })
    },
    onSettled: () => {
      // Refetch lists
      queryClient.invalidateQueries({ queryKey: reptileKeys.lists() })
    },
  })
}
