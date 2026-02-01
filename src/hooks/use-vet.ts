'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  fetchVetVisits,
  fetchVetVisit,
  createVetVisit,
  updateVetVisit,
  deleteVetVisit,
  fetchMedications,
  fetchMedication,
  createMedication,
  updateMedication,
  deleteMedication,
} from '@/lib/api/vet.api'
import { ApiClientError } from '@/lib/api/utils'
import type { VetVisit, Medication } from '@/generated/prisma/client'
import type {
  VetVisitCreate,
  VetVisitUpdate,
  VetQuery,
  MedicationCreate,
  MedicationUpdate,
  MedicationQuery,
} from '@/validations/vet'

// Query keys for cache management
export const vetKeys = {
  all: ['vet'] as const,
  visits: () => [...vetKeys.all, 'visits'] as const,
  visitList: (reptileId: string, filters: Partial<VetQuery> = {}) =>
    [...vetKeys.visits(), 'list', reptileId, filters] as const,
  visitDetail: (visitId: string) =>
    [...vetKeys.visits(), 'detail', visitId] as const,
  medications: () => [...vetKeys.all, 'medications'] as const,
  medicationList: (reptileId: string, filters: Partial<MedicationQuery> = {}) =>
    [...vetKeys.medications(), 'list', reptileId, filters] as const,
  medicationDetail: (medicationId: string) =>
    [...vetKeys.medications(), 'detail', medicationId] as const,
}

// ============================================================================
// VET VISIT HOOKS
// ============================================================================

/**
 * Hook for fetching vet visits for a reptile
 */
export function useVetVisits(reptileId: string, query: Partial<VetQuery> = {}) {
  const {
    data: apiData,
    isPending,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: vetKeys.visitList(reptileId, query),
    queryFn: () => fetchVetVisits(reptileId, query),
    enabled: !!reptileId,
    staleTime: 30 * 1000,
  })

  return {
    visits: (apiData?.data ?? []) as VetVisit[],
    meta: apiData?.meta,
    isPending,
    isError,
    error: error as ApiClientError | null,
    refetch,
  }
}

/**
 * Hook for fetching a single vet visit
 */
export function useVetVisit(visitId: string) {
  return useQuery({
    queryKey: vetKeys.visitDetail(visitId),
    queryFn: () => fetchVetVisit(visitId),
    enabled: !!visitId,
    staleTime: 30 * 1000,
  })
}

/**
 * Hook for creating a vet visit
 */
export function useCreateVetVisit(reptileId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: VetVisitCreate) => createVetVisit(reptileId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: vetKeys.visits() })
    },
  })
}

/**
 * Hook for updating a vet visit
 */
export function useUpdateVetVisit() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ visitId, data }: { visitId: string; data: VetVisitUpdate }) =>
      updateVetVisit(visitId, data),
    onSuccess: (_, { visitId }) => {
      queryClient.invalidateQueries({ queryKey: vetKeys.visits() })
      queryClient.invalidateQueries({ queryKey: vetKeys.visitDetail(visitId) })
    },
  })
}

/**
 * Hook for deleting a vet visit
 */
export function useDeleteVetVisit() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (visitId: string) => deleteVetVisit(visitId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: vetKeys.visits() })
    },
  })
}

// ============================================================================
// MEDICATION HOOKS
// ============================================================================

/**
 * Hook for fetching medications for a reptile
 */
export function useMedications(reptileId: string, query: Partial<MedicationQuery> = {}) {
  const {
    data: apiData,
    isPending,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: vetKeys.medicationList(reptileId, query),
    queryFn: () => fetchMedications(reptileId, query),
    enabled: !!reptileId,
    staleTime: 30 * 1000,
  })

  return {
    medications: (apiData?.data ?? []) as Medication[],
    meta: apiData?.meta,
    isPending,
    isError,
    error: error as ApiClientError | null,
    refetch,
  }
}

/**
 * Hook for fetching a single medication
 */
export function useMedication(medicationId: string) {
  return useQuery({
    queryKey: vetKeys.medicationDetail(medicationId),
    queryFn: () => fetchMedication(medicationId),
    enabled: !!medicationId,
    staleTime: 30 * 1000,
  })
}

/**
 * Hook for creating a medication
 */
export function useCreateMedication(reptileId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: MedicationCreate) => createMedication(reptileId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: vetKeys.medications() })
    },
  })
}

/**
 * Hook for updating a medication
 */
export function useUpdateMedication() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ medicationId, data }: { medicationId: string; data: MedicationUpdate }) =>
      updateMedication(medicationId, data),
    onSuccess: (_, { medicationId }) => {
      queryClient.invalidateQueries({ queryKey: vetKeys.medications() })
      queryClient.invalidateQueries({ queryKey: vetKeys.medicationDetail(medicationId) })
    },
  })
}

/**
 * Hook for deleting a medication
 */
export function useDeleteMedication() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (medicationId: string) => deleteMedication(medicationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: vetKeys.medications() })
    },
  })
}
