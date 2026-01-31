// Shed API Client - Handles HTTP requests to /api/reptiles/[id]/sheds
import type { Shed } from '@/generated/prisma/client'
import type { ShedCreate, ShedUpdate, ShedQuery } from '@/validations/shed'
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
export class ShedApiError extends Error {
  code: string
  status: number

  constructor(code: string, message: string, status: number) {
    super(message)
    this.name = 'ShedApiError'
    this.code = code
    this.status = status
  }
}

// Helper to handle API responses
async function handleResponse<T>(response: Response): Promise<T> {
  const data = await response.json()

  if (!response.ok) {
    if (isErrorResponse(data)) {
      throw new ShedApiError(
        data.error.code,
        data.error.message,
        response.status
      )
    }
    throw new ShedApiError(
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

/**
 * Fetch all sheds for a reptile with optional filtering and pagination
 */
export async function fetchSheds(
  reptileId: string,
  query: Partial<ShedQuery> = {}
): Promise<PaginatedResponse<Shed>> {
  const queryString = buildQueryString(query)
  const response = await fetch(`/api/reptiles/${reptileId}/sheds${queryString}`)
  return handleResponse<PaginatedResponse<Shed>>(response)
}

/**
 * Fetch a single shed by ID
 */
export async function fetchShed(
  reptileId: string,
  shedId: string
): Promise<Shed> {
  const response = await fetch(`/api/reptiles/${reptileId}/sheds/${shedId}`)
  const result = await handleResponse<SingleResponse<Shed>>(response)
  return result.data
}

/**
 * Create a new shed record
 */
export async function createShed(
  reptileId: string,
  data: ShedCreate
): Promise<Shed> {
  const response = await fetch(`/api/reptiles/${reptileId}/sheds`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })
  const result = await handleResponse<SingleResponse<Shed>>(response)
  return result.data
}

/**
 * Update an existing shed record
 */
export async function updateShed(
  reptileId: string,
  shedId: string,
  data: ShedUpdate
): Promise<Shed> {
  const response = await fetch(`/api/reptiles/${reptileId}/sheds/${shedId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })
  const result = await handleResponse<SingleResponse<Shed>>(response)
  return result.data
}

/**
 * Delete a shed record
 */
export async function deleteShed(
  reptileId: string,
  shedId: string
): Promise<{ id: string; deletedAt: string }> {
  const response = await fetch(`/api/reptiles/${reptileId}/sheds/${shedId}`, {
    method: 'DELETE',
  })
  const result = await handleResponse<SingleResponse<{ id: string; deletedAt: string }>>(response)
  return result.data
}
