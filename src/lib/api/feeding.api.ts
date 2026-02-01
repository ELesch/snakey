// Feeding API Client - Handles HTTP requests to /api/reptiles/[id]/feedings
import type { Feeding } from '@/generated/prisma/client'
import type { FeedingCreate, FeedingUpdate, FeedingQuery } from '@/validations/feeding'
import type { PaginatedResponse, SingleResponse } from './types'
import { handleResponse, buildQueryString } from './utils'

// Re-export ApiClientError for backwards compatibility
export { ApiClientError } from './utils'

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
