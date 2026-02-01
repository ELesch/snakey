// Weight API Client - Handles HTTP requests to /api/reptiles/[id]/weights
import type { Weight } from '@/generated/prisma/client'
import type { WeightCreate, WeightUpdate, WeightQuery } from '@/validations/weight'
import type { PaginatedResponse, SingleResponse } from './types'
import { handleResponse, buildQueryString } from './utils'

// Re-export ApiClientError for backwards compatibility
export { ApiClientError } from './utils'

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
