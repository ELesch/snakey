// Weight API Client - Handles HTTP requests to /api/reptiles/[id]/weights
import type { Weight } from '@/generated/prisma/client'
import type { WeightCreate, WeightUpdate, WeightQuery } from '@/validations/weight'
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
export class WeightApiError extends Error {
  code: string
  status: number

  constructor(code: string, message: string, status: number) {
    super(message)
    this.name = 'WeightApiError'
    this.code = code
    this.status = status
  }
}

// Helper to handle API responses
async function handleResponse<T>(response: Response): Promise<T> {
  const data = await response.json()

  if (!response.ok) {
    if (isErrorResponse(data)) {
      throw new WeightApiError(
        data.error.code,
        data.error.message,
        response.status
      )
    }
    throw new WeightApiError(
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
 * Fetch all weights for a reptile with optional filtering and pagination
 */
export async function fetchWeights(
  reptileId: string,
  query: Partial<WeightQuery> = {}
): Promise<PaginatedResponse<Weight>> {
  const queryString = buildQueryString(query)
  const response = await fetch(`/api/reptiles/${reptileId}/weights${queryString}`)
  return handleResponse<PaginatedResponse<Weight>>(response)
}

/**
 * Fetch a single weight by ID
 */
export async function fetchWeight(
  reptileId: string,
  weightId: string
): Promise<Weight> {
  const response = await fetch(`/api/reptiles/${reptileId}/weights/${weightId}`)
  const result = await handleResponse<SingleResponse<Weight>>(response)
  return result.data
}

/**
 * Create a new weight record
 */
export async function createWeight(
  reptileId: string,
  data: WeightCreate
): Promise<Weight> {
  const response = await fetch(`/api/reptiles/${reptileId}/weights`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })
  const result = await handleResponse<SingleResponse<Weight>>(response)
  return result.data
}

/**
 * Update an existing weight record
 */
export async function updateWeight(
  reptileId: string,
  weightId: string,
  data: WeightUpdate
): Promise<Weight> {
  const response = await fetch(`/api/reptiles/${reptileId}/weights/${weightId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })
  const result = await handleResponse<SingleResponse<Weight>>(response)
  return result.data
}

/**
 * Delete a weight record
 */
export async function deleteWeight(
  reptileId: string,
  weightId: string
): Promise<{ id: string; deletedAt: string }> {
  const response = await fetch(`/api/reptiles/${reptileId}/weights/${weightId}`, {
    method: 'DELETE',
  })
  const result = await handleResponse<SingleResponse<{ id: string; deletedAt: string }>>(response)
  return result.data
}
