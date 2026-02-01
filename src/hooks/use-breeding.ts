'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useOnlineStatus } from './use-online-status'
import {
  fetchPairings,
  fetchPairing,
  createPairing,
  updatePairing,
  deletePairing,
  fetchClutches,
  fetchClutch,
  createClutch,
  updateClutch,
  deleteClutch,
  fetchHatchlings,
  fetchHatchling,
  createHatchling,
  updateHatchling,
  deleteHatchling,
} from '@/lib/api/breeding.api'
import { ApiClientError } from '@/lib/api/utils'
import type { Pairing, Clutch, Hatchling } from '@/generated/prisma/client'
import type {
  PairingCreate,
  PairingUpdate,
  PairingQuery,
  ClutchCreate,
  ClutchUpdate,
  ClutchQuery,
  HatchlingCreate,
  HatchlingUpdate,
  HatchlingQuery,
} from '@/validations/breeding'

// ============================================================================
// QUERY KEYS
// ============================================================================

export const breedingKeys = {
  // Pairings
  pairings: ['pairings'] as const,
  pairingLists: () => [...breedingKeys.pairings, 'list'] as const,
  pairingList: (filters: Partial<PairingQuery> = {}) =>
    [...breedingKeys.pairingLists(), filters] as const,
  pairingDetails: () => [...breedingKeys.pairings, 'detail'] as const,
  pairingDetail: (id: string) => [...breedingKeys.pairingDetails(), id] as const,

  // Clutches
  clutches: ['clutches'] as const,
  clutchLists: () => [...breedingKeys.clutches, 'list'] as const,
  clutchList: (pairingId: string, filters: Partial<ClutchQuery> = {}) =>
    [...breedingKeys.clutchLists(), pairingId, filters] as const,
  clutchDetails: () => [...breedingKeys.clutches, 'detail'] as const,
  clutchDetail: (id: string) => [...breedingKeys.clutchDetails(), id] as const,

  // Hatchlings
  hatchlings: ['hatchlings'] as const,
  hatchlingLists: () => [...breedingKeys.hatchlings, 'list'] as const,
  hatchlingList: (clutchId: string, filters: Partial<HatchlingQuery> = {}) =>
    [...breedingKeys.hatchlingLists(), clutchId, filters] as const,
  hatchlingDetails: () => [...breedingKeys.hatchlings, 'detail'] as const,
  hatchlingDetail: (id: string) => [...breedingKeys.hatchlingDetails(), id] as const,
}

// ============================================================================
// PAIRING HOOKS
// ============================================================================

/**
 * Hook for fetching pairings list
 */
export function usePairings(query: Partial<PairingQuery> = {}) {
  const isOnline = useOnlineStatus()

  const {
    data: apiData,
    isPending,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: breedingKeys.pairingList(query),
    queryFn: () => fetchPairings(query),
    enabled: isOnline,
    staleTime: 30 * 1000,
  })

  return {
    pairings: apiData?.data ?? [],
    meta: apiData?.meta,
    isPending,
    isError,
    error: error as ApiClientError | null,
    isOnline,
    refetch,
  }
}

/**
 * Hook for fetching a single pairing
 */
export function usePairing(pairingId: string, options: { enabled?: boolean } = {}) {
  const { enabled = true } = options
  const isOnline = useOnlineStatus()

  const {
    data: pairing,
    isPending,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: breedingKeys.pairingDetail(pairingId),
    queryFn: () => fetchPairing(pairingId),
    enabled: enabled && isOnline && !!pairingId,
    staleTime: 30 * 1000,
  })

  return {
    pairing: pairing as Pairing | undefined,
    isPending,
    isError,
    error: error as ApiClientError | null,
    isOnline,
    refetch,
  }
}

/**
 * Hook for creating a pairing
 */
export function useCreatePairing() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: PairingCreate) => createPairing(data),
    onSuccess: (newPairing) => {
      queryClient.invalidateQueries({ queryKey: breedingKeys.pairingLists() })
      queryClient.setQueryData(breedingKeys.pairingDetail(newPairing.id), newPairing)
    },
  })
}

/**
 * Hook for updating a pairing
 */
export function useUpdatePairing() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ pairingId, data }: { pairingId: string; data: PairingUpdate }) =>
      updatePairing(pairingId, data),
    onMutate: async ({ pairingId, data }) => {
      await queryClient.cancelQueries({
        queryKey: breedingKeys.pairingDetail(pairingId),
      })
      const previousPairing = queryClient.getQueryData(
        breedingKeys.pairingDetail(pairingId)
      )
      queryClient.setQueryData(
        breedingKeys.pairingDetail(pairingId),
        (old: Pairing | undefined) =>
          old ? { ...old, ...data, updatedAt: new Date() } : old
      )
      return { previousPairing }
    },
    onError: (err, { pairingId }, context) => {
      if (context?.previousPairing) {
        queryClient.setQueryData(
          breedingKeys.pairingDetail(pairingId),
          context.previousPairing
        )
      }
    },
    onSettled: (_, __, { pairingId }) => {
      queryClient.invalidateQueries({
        queryKey: breedingKeys.pairingDetail(pairingId),
      })
      queryClient.invalidateQueries({ queryKey: breedingKeys.pairingLists() })
    },
  })
}

/**
 * Hook for deleting a pairing
 */
export function useDeletePairing() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (pairingId: string) => deletePairing(pairingId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: breedingKeys.pairingLists() })
    },
  })
}

// ============================================================================
// CLUTCH HOOKS
// ============================================================================

/**
 * Hook for fetching clutches for a pairing
 */
export function useClutches(pairingId: string, query: Partial<ClutchQuery> = {}) {
  const isOnline = useOnlineStatus()

  const {
    data: apiData,
    isPending,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: breedingKeys.clutchList(pairingId, query),
    queryFn: () => fetchClutches(pairingId, query),
    enabled: isOnline && !!pairingId,
    staleTime: 30 * 1000,
  })

  return {
    clutches: apiData?.data ?? [],
    meta: apiData?.meta,
    isPending,
    isError,
    error: error as ApiClientError | null,
    isOnline,
    refetch,
  }
}

/**
 * Hook for fetching a single clutch
 */
export function useClutch(clutchId: string, options: { enabled?: boolean } = {}) {
  const { enabled = true } = options
  const isOnline = useOnlineStatus()

  const {
    data: clutch,
    isPending,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: breedingKeys.clutchDetail(clutchId),
    queryFn: () => fetchClutch(clutchId),
    enabled: enabled && isOnline && !!clutchId,
    staleTime: 30 * 1000,
  })

  return {
    clutch: clutch as Clutch | undefined,
    isPending,
    isError,
    error: error as ApiClientError | null,
    isOnline,
    refetch,
  }
}

/**
 * Hook for creating a clutch
 */
export function useCreateClutch(pairingId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: ClutchCreate) => createClutch(pairingId, data),
    onSuccess: (newClutch) => {
      queryClient.invalidateQueries({
        queryKey: breedingKeys.clutchLists(),
      })
      queryClient.setQueryData(breedingKeys.clutchDetail(newClutch.id), newClutch)
    },
  })
}

/**
 * Hook for updating a clutch
 */
export function useUpdateClutch() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ clutchId, data }: { clutchId: string; data: ClutchUpdate }) =>
      updateClutch(clutchId, data),
    onMutate: async ({ clutchId, data }) => {
      await queryClient.cancelQueries({
        queryKey: breedingKeys.clutchDetail(clutchId),
      })
      const previousClutch = queryClient.getQueryData(
        breedingKeys.clutchDetail(clutchId)
      )
      queryClient.setQueryData(
        breedingKeys.clutchDetail(clutchId),
        (old: Clutch | undefined) =>
          old ? { ...old, ...data, updatedAt: new Date() } : old
      )
      return { previousClutch }
    },
    onError: (err, { clutchId }, context) => {
      if (context?.previousClutch) {
        queryClient.setQueryData(
          breedingKeys.clutchDetail(clutchId),
          context.previousClutch
        )
      }
    },
    onSettled: (_, __, { clutchId }) => {
      queryClient.invalidateQueries({
        queryKey: breedingKeys.clutchDetail(clutchId),
      })
      queryClient.invalidateQueries({ queryKey: breedingKeys.clutchLists() })
    },
  })
}

/**
 * Hook for deleting a clutch
 */
export function useDeleteClutch(pairingId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (clutchId: string) => deleteClutch(clutchId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: breedingKeys.clutchList(pairingId),
      })
    },
  })
}

// ============================================================================
// HATCHLING HOOKS
// ============================================================================

/**
 * Hook for fetching hatchlings for a clutch
 */
export function useHatchlings(clutchId: string, query: Partial<HatchlingQuery> = {}) {
  const isOnline = useOnlineStatus()

  const {
    data: apiData,
    isPending,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: breedingKeys.hatchlingList(clutchId, query),
    queryFn: () => fetchHatchlings(clutchId, query),
    enabled: isOnline && !!clutchId,
    staleTime: 30 * 1000,
  })

  return {
    hatchlings: apiData?.data ?? [],
    meta: apiData?.meta,
    isPending,
    isError,
    error: error as ApiClientError | null,
    isOnline,
    refetch,
  }
}

/**
 * Hook for fetching a single hatchling
 */
export function useHatchling(hatchlingId: string, options: { enabled?: boolean } = {}) {
  const { enabled = true } = options
  const isOnline = useOnlineStatus()

  const {
    data: hatchling,
    isPending,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: breedingKeys.hatchlingDetail(hatchlingId),
    queryFn: () => fetchHatchling(hatchlingId),
    enabled: enabled && isOnline && !!hatchlingId,
    staleTime: 30 * 1000,
  })

  return {
    hatchling: hatchling as Hatchling | undefined,
    isPending,
    isError,
    error: error as ApiClientError | null,
    isOnline,
    refetch,
  }
}

/**
 * Hook for creating a hatchling
 */
export function useCreateHatchling(clutchId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: HatchlingCreate) => createHatchling(clutchId, data),
    onSuccess: (newHatchling) => {
      queryClient.invalidateQueries({
        queryKey: breedingKeys.hatchlingLists(),
      })
      queryClient.setQueryData(
        breedingKeys.hatchlingDetail(newHatchling.id),
        newHatchling
      )
    },
  })
}

/**
 * Hook for updating a hatchling
 */
export function useUpdateHatchling() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ hatchlingId, data }: { hatchlingId: string; data: HatchlingUpdate }) =>
      updateHatchling(hatchlingId, data),
    onMutate: async ({ hatchlingId, data }) => {
      await queryClient.cancelQueries({
        queryKey: breedingKeys.hatchlingDetail(hatchlingId),
      })
      const previousHatchling = queryClient.getQueryData(
        breedingKeys.hatchlingDetail(hatchlingId)
      )
      queryClient.setQueryData(
        breedingKeys.hatchlingDetail(hatchlingId),
        (old: Hatchling | undefined) => (old ? { ...old, ...data } : old)
      )
      return { previousHatchling }
    },
    onError: (err, { hatchlingId }, context) => {
      if (context?.previousHatchling) {
        queryClient.setQueryData(
          breedingKeys.hatchlingDetail(hatchlingId),
          context.previousHatchling
        )
      }
    },
    onSettled: (_, __, { hatchlingId }) => {
      queryClient.invalidateQueries({
        queryKey: breedingKeys.hatchlingDetail(hatchlingId),
      })
      queryClient.invalidateQueries({ queryKey: breedingKeys.hatchlingLists() })
    },
  })
}

/**
 * Hook for deleting a hatchling
 */
export function useDeleteHatchling(clutchId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (hatchlingId: string) => deleteHatchling(hatchlingId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: breedingKeys.hatchlingList(clutchId),
      })
    },
  })
}
