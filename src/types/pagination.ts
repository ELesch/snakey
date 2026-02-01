// Shared Pagination Types
// Re-exports from centralized API types plus additional service-layer types

// Re-export PaginationMeta from the canonical location
export type { PaginationMeta } from '@/lib/api/types'

// Import for use in local types
import type { PaginationMeta } from '@/lib/api/types'

/**
 * Generic paginated result wrapper for service layer.
 * This is the same structure as PaginatedResponse from API types.
 */
export interface PaginatedResult<T> {
  data: T[]
  meta: PaginationMeta
}

/**
 * Common pagination query parameters for service methods.
 */
export interface PaginationQuery {
  page?: number
  limit?: number
  sort?: string
  order?: 'asc' | 'desc'
}
