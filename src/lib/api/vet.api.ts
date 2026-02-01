// Vet API Client - Handles HTTP requests to vet-related endpoints
import type { VetVisit, Medication } from '@/generated/prisma/client'
import type {
  VetVisitCreate,
  VetVisitUpdate,
  VetQuery,
  MedicationCreate,
  MedicationUpdate,
  MedicationQuery,
} from '@/validations/vet'
import type { PaginatedResponse, SingleResponse } from './types'
import { handleResponse, buildQueryString } from './utils'

// Re-export ApiClientError for backwards compatibility
export { ApiClientError } from './utils'

// ============================================================================
// VET VISIT API FUNCTIONS
// ============================================================================

export async function fetchVetVisits(
  reptileId: string,
  query: Partial<VetQuery> = {}
): Promise<PaginatedResponse<VetVisit>> {
  const queryString = buildQueryString(query)
  const response = await fetch(`/api/reptiles/${reptileId}/vet-visits${queryString}`)
  return handleResponse<PaginatedResponse<VetVisit>>(response)
}

export async function fetchVetVisit(visitId: string): Promise<VetVisit> {
  const response = await fetch(`/api/vet-visits/${visitId}`)
  const result = await handleResponse<SingleResponse<VetVisit>>(response)
  return result.data
}

export async function createVetVisit(
  reptileId: string,
  data: VetVisitCreate
): Promise<VetVisit> {
  const response = await fetch(`/api/reptiles/${reptileId}/vet-visits`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  const result = await handleResponse<SingleResponse<VetVisit>>(response)
  return result.data
}

export async function updateVetVisit(
  visitId: string,
  data: VetVisitUpdate
): Promise<VetVisit> {
  const response = await fetch(`/api/vet-visits/${visitId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  const result = await handleResponse<SingleResponse<VetVisit>>(response)
  return result.data
}

export async function deleteVetVisit(
  visitId: string
): Promise<{ id: string }> {
  const response = await fetch(`/api/vet-visits/${visitId}`, {
    method: 'DELETE',
  })
  const result = await handleResponse<SingleResponse<{ id: string }>>(response)
  return result.data
}

// ============================================================================
// MEDICATION API FUNCTIONS
// ============================================================================

export async function fetchMedications(
  reptileId: string,
  query: Partial<MedicationQuery> = {}
): Promise<PaginatedResponse<Medication>> {
  const queryString = buildQueryString(query)
  const response = await fetch(`/api/reptiles/${reptileId}/medications${queryString}`)
  return handleResponse<PaginatedResponse<Medication>>(response)
}

export async function fetchMedication(medicationId: string): Promise<Medication> {
  const response = await fetch(`/api/medications/${medicationId}`)
  const result = await handleResponse<SingleResponse<Medication>>(response)
  return result.data
}

export async function createMedication(
  reptileId: string,
  data: MedicationCreate
): Promise<Medication> {
  const response = await fetch(`/api/reptiles/${reptileId}/medications`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  const result = await handleResponse<SingleResponse<Medication>>(response)
  return result.data
}

export async function updateMedication(
  medicationId: string,
  data: MedicationUpdate
): Promise<Medication> {
  const response = await fetch(`/api/medications/${medicationId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  const result = await handleResponse<SingleResponse<Medication>>(response)
  return result.data
}

export async function deleteMedication(
  medicationId: string
): Promise<{ id: string }> {
  const response = await fetch(`/api/medications/${medicationId}`, {
    method: 'DELETE',
  })
  const result = await handleResponse<SingleResponse<{ id: string }>>(response)
  return result.data
}
