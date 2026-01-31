// Shared Pagination Types
// Used across services for consistent pagination responses

/**
 * Metadata for paginated results
 */
export interface PaginationMeta {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

/**
 * Generic paginated result wrapper
 */
export interface PaginatedResult<T> {
  data: T[]
  meta: PaginationMeta
}

/**
 * Common pagination query parameters
 */
export interface PaginationQuery {
  page?: number
  limit?: number
  sort?: string
  order?: 'asc' | 'desc'
}
