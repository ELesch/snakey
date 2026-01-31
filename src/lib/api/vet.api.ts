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
import {
  type PaginatedResponse,
  type SingleResponse,
  type ErrorResponse,
} from './reptile.api'

// Type guard
function isErrorResponse(response: unknown): response is ErrorResponse {
  return (
    typeof response === 'object' &&
    response !== null &&
    'error' in response &&
    typeof (response as ErrorResponse).error === 'object'
  )
}

// API Error class
export class VetApiError extends Error {
  code: string
  status: number

  constructor(code: string, message: string, status: number) {
    super(message)
    this.name = 'VetApiError'
    this.code = code
    this.status = status
  }
}

// Helper to handle API responses
async function handleResponse<T>(response: Response): Promise<T> {
  const data = await response.json()

  if (!response.ok) {
    if (isErrorResponse(data)) {
      throw new VetApiError(
        data.error.code,
        data.error.message,
        response.status
      )
    }
    throw new VetApiError(
      'UNKNOWN_ERROR',
      'An unexpected error occurred',
      response.status
    )
  }

  return data as T
}

// Build query string from params
function buildQueryString(params: Record<string, unknown>): string {
  const searchParams = new URLSearchParams()

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      if (value instanceof Date) {
        searchParams.set(key, value.toISOString())
      } else {
        searchParams.set(key, String(value))
      }
    }
  })

  const queryString = searchParams.toString()
  return queryString ? `?${queryString}` : ''
}

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
