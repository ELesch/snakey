// Environment API Client - Handles HTTP requests to /api/reptiles/[id]/environment
import type { EnvironmentLog } from '@/generated/prisma/client'
import type { EnvironmentCreate, EnvironmentUpdate, EnvironmentQuery } from '@/validations/environment'
import type { PaginatedResponse, SingleResponse } from './types'
import { handleResponse, buildQueryString } from './utils'

// Re-export ApiClientError for backwards compatibility
export { ApiClientError } from './utils'

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
