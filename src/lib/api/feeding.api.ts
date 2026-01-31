// Feeding API Client - Handles HTTP requests to /api/reptiles/[id]/feedings
import type { Feeding } from '@/generated/prisma/client'
import type { FeedingCreate, FeedingUpdate, FeedingQuery } from '@/validations/feeding'
import {
  type ApiError,
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
export class FeedingApiError extends Error {
  code: string
  status: number

  constructor(code: string, message: string, status: number) {
    super(message)
    this.name = 'FeedingApiError'
    this.code = code
    this.status = status
  }
}

// Helper to handle API responses
async function handleResponse<T>(response: Response): Promise<T> {
  const data = await response.json()

  if (!response.ok) {
    if (isErrorResponse(data)) {
      throw new FeedingApiError(
        data.error.code,
        data.error.message,
        response.status
      )
    }
    throw new FeedingApiError(
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
 * Fetch all feedings for a reptile with optional filtering and pagination
 */
export async function fetchFeedings(
  reptileId: string,
  query: Partial<FeedingQuery> = {}
): Promise<PaginatedResponse<Feeding>> {
  const queryString = buildQueryString(query)
  const response = await fetch(`/api/reptiles/${reptileId}/feedings${queryString}`)
  return handleResponse<PaginatedResponse<Feeding>>(response)
}

/**
 * Fetch a single feeding by ID
 */
export async function fetchFeeding(
  reptileId: string,
  feedingId: string
): Promise<Feeding> {
  const response = await fetch(`/api/reptiles/${reptileId}/feedings/${feedingId}`)
  const result = await handleResponse<SingleResponse<Feeding>>(response)
  return result.data
}

/**
 * Create a new feeding
 */
export async function createFeeding(
  reptileId: string,
  data: FeedingCreate
): Promise<Feeding> {
  const response = await fetch(`/api/reptiles/${reptileId}/feedings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })
  const result = await handleResponse<SingleResponse<Feeding>>(response)
  return result.data
}

/**
 * Update an existing feeding
 */
export async function updateFeeding(
  reptileId: string,
  feedingId: string,
  data: FeedingUpdate
): Promise<Feeding> {
  const response = await fetch(`/api/reptiles/${reptileId}/feedings/${feedingId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })
  const result = await handleResponse<SingleResponse<Feeding>>(response)
  return result.data
}

/**
 * Delete a feeding
 */
export async function deleteFeeding(
  reptileId: string,
  feedingId: string
): Promise<{ id: string; deletedAt: string }> {
  const response = await fetch(`/api/reptiles/${reptileId}/feedings/${feedingId}`, {
    method: 'DELETE',
  })
  const result = await handleResponse<SingleResponse<{ id: string; deletedAt: string }>>(response)
  return result.data
}
