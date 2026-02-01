// Shed API Client - Handles HTTP requests to /api/reptiles/[id]/sheds
import type { Shed } from '@/generated/prisma/client'
import type { ShedCreate, ShedUpdate, ShedQuery } from '@/validations/shed'
import type { PaginatedResponse, SingleResponse } from './types'
import { handleResponse, buildQueryString } from './utils'

// Re-export ApiClientError for backwards compatibility
export { ApiClientError } from './utils'

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
