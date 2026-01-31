// Environment API Client - Handles HTTP requests to /api/reptiles/[id]/environment
import type { EnvironmentLog } from '@/generated/prisma/client'
import type { EnvironmentCreate, EnvironmentUpdate, EnvironmentQuery } from '@/validations/environment'
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
export class EnvironmentApiError extends Error {
  code: string
  status: number

  constructor(code: string, message: string, status: number) {
    super(message)
    this.name = 'EnvironmentApiError'
    this.code = code
    this.status = status
  }
}

// Helper to handle API responses
async function handleResponse<T>(response: Response): Promise<T> {
  const data = await response.json()

  if (!response.ok) {
    if (isErrorResponse(data)) {
      throw new EnvironmentApiError(
        data.error.code,
        data.error.message,
        response.status
      )
    }
    throw new EnvironmentApiError(
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
 * Fetch all environment logs for a reptile with optional filtering and pagination
 */
export async function fetchEnvironmentLogs(
  reptileId: string,
  query: Partial<EnvironmentQuery> = {}
): Promise<PaginatedResponse<EnvironmentLog>> {
  const queryString = buildQueryString(query)
  const response = await fetch(`/api/reptiles/${reptileId}/environment${queryString}`)
  return handleResponse<PaginatedResponse<EnvironmentLog>>(response)
}

/**
 * Fetch a single environment log by ID
 */
export async function fetchEnvironmentLog(
  reptileId: string,
  logId: string
): Promise<EnvironmentLog> {
  const response = await fetch(`/api/reptiles/${reptileId}/environment/${logId}`)
  const result = await handleResponse<SingleResponse<EnvironmentLog>>(response)
  return result.data
}

/**
 * Create a new environment log
 */
export async function createEnvironmentLog(
  reptileId: string,
  data: EnvironmentCreate
): Promise<EnvironmentLog> {
  const response = await fetch(`/api/reptiles/${reptileId}/environment`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })
  const result = await handleResponse<SingleResponse<EnvironmentLog>>(response)
  return result.data
}

/**
 * Update an existing environment log
 */
export async function updateEnvironmentLog(
  reptileId: string,
  logId: string,
  data: EnvironmentUpdate
): Promise<EnvironmentLog> {
  const response = await fetch(`/api/reptiles/${reptileId}/environment/${logId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })
  const result = await handleResponse<SingleResponse<EnvironmentLog>>(response)
  return result.data
}

/**
 * Delete an environment log
 */
export async function deleteEnvironmentLog(
  reptileId: string,
  logId: string
): Promise<{ id: string; deletedAt: string }> {
  const response = await fetch(`/api/reptiles/${reptileId}/environment/${logId}`, {
    method: 'DELETE',
  })
  const result = await handleResponse<SingleResponse<{ id: string; deletedAt: string }>>(response)
  return result.data
}
