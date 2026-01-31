// Breeding API Client - Handles HTTP requests to /api/pairings, /api/clutches, /api/hatchlings
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
import {
  type PaginatedResponse,
  type SingleResponse,
  type ErrorResponse,
} from './reptile.api'

// Type guards
function isErrorResponse(response: unknown): response is ErrorResponse {
  return (
    typeof response === 'object' &&
    response !== null &&
    'error' in response &&
    typeof (response as ErrorResponse).error === 'object'
  )
}

// API Error class for better error handling
export class BreedingApiError extends Error {
  code: string
  status: number

  constructor(code: string, message: string, status: number) {
    super(message)
    this.name = 'BreedingApiError'
    this.code = code
    this.status = status
  }
}

// Helper to handle API responses
async function handleResponse<T>(response: Response): Promise<T> {
  const data = await response.json()

  if (!response.ok) {
    if (isErrorResponse(data)) {
      throw new BreedingApiError(
        data.error.code,
        data.error.message,
        response.status
      )
    }
    throw new BreedingApiError(
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
      if (Array.isArray(value)) {
        searchParams.set(key, value.join(','))
      } else if (value instanceof Date) {
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
// PAIRING API
// ============================================================================

/**
 * Fetch all pairings with optional filtering and pagination
 */
export async function fetchPairings(
  query: Partial<PairingQuery> = {}
): Promise<PaginatedResponse<Pairing>> {
  const queryString = buildQueryString(query)
  const response = await fetch(`/api/pairings${queryString}`)
  return handleResponse<PaginatedResponse<Pairing>>(response)
}

/**
 * Fetch a single pairing by ID
 */
export async function fetchPairing(pairingId: string): Promise<Pairing> {
  const response = await fetch(`/api/pairings/${pairingId}`)
  const result = await handleResponse<SingleResponse<Pairing>>(response)
  return result.data
}

/**
 * Create a new pairing
 */
export async function createPairing(data: PairingCreate): Promise<Pairing> {
  const response = await fetch('/api/pairings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })
  const result = await handleResponse<SingleResponse<Pairing>>(response)
  return result.data
}

/**
 * Update an existing pairing
 */
export async function updatePairing(
  pairingId: string,
  data: PairingUpdate
): Promise<Pairing> {
  const response = await fetch(`/api/pairings/${pairingId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })
  const result = await handleResponse<SingleResponse<Pairing>>(response)
  return result.data
}

/**
 * Delete a pairing
 */
export async function deletePairing(
  pairingId: string
): Promise<{ id: string }> {
  const response = await fetch(`/api/pairings/${pairingId}`, {
    method: 'DELETE',
  })
  const result = await handleResponse<SingleResponse<{ id: string }>>(response)
  return result.data
}

// ============================================================================
// CLUTCH API
// ============================================================================

/**
 * Fetch all clutches for a pairing with optional filtering and pagination
 */
export async function fetchClutches(
  pairingId: string,
  query: Partial<ClutchQuery> = {}
): Promise<PaginatedResponse<Clutch>> {
  const queryString = buildQueryString(query)
  const response = await fetch(`/api/pairings/${pairingId}/clutches${queryString}`)
  return handleResponse<PaginatedResponse<Clutch>>(response)
}

/**
 * Fetch a single clutch by ID
 */
export async function fetchClutch(clutchId: string): Promise<Clutch> {
  const response = await fetch(`/api/clutches/${clutchId}`)
  const result = await handleResponse<SingleResponse<Clutch>>(response)
  return result.data
}

/**
 * Create a new clutch
 */
export async function createClutch(
  pairingId: string,
  data: ClutchCreate
): Promise<Clutch> {
  const response = await fetch(`/api/pairings/${pairingId}/clutches`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })
  const result = await handleResponse<SingleResponse<Clutch>>(response)
  return result.data
}

/**
 * Update an existing clutch
 */
export async function updateClutch(
  clutchId: string,
  data: ClutchUpdate
): Promise<Clutch> {
  const response = await fetch(`/api/clutches/${clutchId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })
  const result = await handleResponse<SingleResponse<Clutch>>(response)
  return result.data
}

/**
 * Delete a clutch
 */
export async function deleteClutch(clutchId: string): Promise<{ id: string }> {
  const response = await fetch(`/api/clutches/${clutchId}`, {
    method: 'DELETE',
  })
  const result = await handleResponse<SingleResponse<{ id: string }>>(response)
  return result.data
}

// ============================================================================
// HATCHLING API
// ============================================================================

/**
 * Fetch all hatchlings for a clutch with optional filtering and pagination
 */
export async function fetchHatchlings(
  clutchId: string,
  query: Partial<HatchlingQuery> = {}
): Promise<PaginatedResponse<Hatchling>> {
  const queryString = buildQueryString(query)
  const response = await fetch(`/api/clutches/${clutchId}/hatchlings${queryString}`)
  return handleResponse<PaginatedResponse<Hatchling>>(response)
}

/**
 * Fetch a single hatchling by ID
 */
export async function fetchHatchling(hatchlingId: string): Promise<Hatchling> {
  const response = await fetch(`/api/hatchlings/${hatchlingId}`)
  const result = await handleResponse<SingleResponse<Hatchling>>(response)
  return result.data
}

/**
 * Create a new hatchling
 */
export async function createHatchling(
  clutchId: string,
  data: HatchlingCreate
): Promise<Hatchling> {
  const response = await fetch(`/api/clutches/${clutchId}/hatchlings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })
  const result = await handleResponse<SingleResponse<Hatchling>>(response)
  return result.data
}

/**
 * Update an existing hatchling
 */
export async function updateHatchling(
  hatchlingId: string,
  data: HatchlingUpdate
): Promise<Hatchling> {
  const response = await fetch(`/api/hatchlings/${hatchlingId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })
  const result = await handleResponse<SingleResponse<Hatchling>>(response)
  return result.data
}

/**
 * Delete a hatchling
 */
export async function deleteHatchling(
  hatchlingId: string
): Promise<{ id: string }> {
  const response = await fetch(`/api/hatchlings/${hatchlingId}`, {
    method: 'DELETE',
  })
  const result = await handleResponse<SingleResponse<{ id: string }>>(response)
  return result.data
}
