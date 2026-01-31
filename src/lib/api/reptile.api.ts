// Reptile API Client - Handles HTTP requests to /api/reptiles
import type { Reptile } from '@/generated/prisma/client'
import type { ReptileCreate, ReptileUpdate, ReptileQuery } from '@/validations/reptile'

// API Response Types
export interface ApiError {
  code: string
  message: string
  details?: unknown
}

export interface PaginatedResponse<T> {
  data: T[]
  meta: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

export interface SingleResponse<T> {
  data: T
}

export interface ErrorResponse {
  error: ApiError
}

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
export class ReptileApiError extends Error {
  code: string
  status: number

  constructor(code: string, message: string, status: number) {
    super(message)
    this.name = 'ReptileApiError'
    this.code = code
    this.status = status
  }
}

// Helper to handle API responses
async function handleResponse<T>(response: Response): Promise<T> {
  const data = await response.json()

  if (!response.ok) {
    if (isErrorResponse(data)) {
      throw new ReptileApiError(
        data.error.code,
        data.error.message,
        response.status
      )
    }
    throw new ReptileApiError(
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
      } else {
        searchParams.set(key, String(value))
      }
    }
  })

  const queryString = searchParams.toString()
  return queryString ? `?${queryString}` : ''
}

/**
 * Fetch all reptiles with optional filtering and pagination
 */
export async function fetchReptiles(
  query: Partial<ReptileQuery> = {}
): Promise<PaginatedResponse<Reptile>> {
  const queryString = buildQueryString(query)
  const response = await fetch(`/api/reptiles${queryString}`)
  return handleResponse<PaginatedResponse<Reptile>>(response)
}

/**
 * Fetch a single reptile by ID
 */
export async function fetchReptile(
  id: string,
  options: {
    include?: string[]
    feedingsLimit?: number
    shedsLimit?: number
    weightsLimit?: number
    photosLimit?: number
    shareId?: string
  } = {}
): Promise<Reptile> {
  const queryString = buildQueryString({
    ...options,
    include: options.include?.join(','),
  })
  const response = await fetch(`/api/reptiles/${id}${queryString}`)
  const result = await handleResponse<SingleResponse<Reptile>>(response)
  return result.data
}

/**
 * Create a new reptile
 */
export async function createReptile(
  data: ReptileCreate
): Promise<Reptile> {
  const response = await fetch('/api/reptiles', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })
  const result = await handleResponse<SingleResponse<Reptile>>(response)
  return result.data
}

/**
 * Update an existing reptile
 */
export async function updateReptile(
  id: string,
  data: ReptileUpdate
): Promise<Reptile> {
  const response = await fetch(`/api/reptiles/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })
  const result = await handleResponse<SingleResponse<Reptile>>(response)
  return result.data
}

/**
 * Delete (soft delete) a reptile
 */
export async function deleteReptile(
  id: string
): Promise<{ id: string; deletedAt: string }> {
  const response = await fetch(`/api/reptiles/${id}`, {
    method: 'DELETE',
  })
  const result = await handleResponse<SingleResponse<{ id: string; deletedAt: string }>>(response)
  return result.data
}
