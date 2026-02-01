/**
 * Shared API Client Types
 *
 * This module consolidates common types used across all API client modules.
 * Import from this file instead of duplicating types in each API module.
 */

/**
 * Standard API error structure returned by the server.
 * Contains error code, human-readable message, and optional details.
 */
export interface ApiError {
  /** Machine-readable error code (e.g., 'NOT_FOUND', 'VALIDATION_ERROR') */
  code: string
  /** Human-readable error message */
  message: string
  /** Optional additional error details (validation errors, etc.) */
  details?: unknown
}

/**
 * Error response envelope returned by the server on failure.
 * All error responses follow this structure.
 */
export interface ErrorResponse {
  error: ApiError
}

/**
 * Single item response envelope.
 * Used when the API returns a single resource.
 *
 * @example
 * // Server response for GET /api/reptiles/:id
 * { data: { id: '123', name: 'Monty', species: 'ball_python' } }
 */
export interface SingleResponse<T> {
  data: T
}

/**
 * Paginated list response envelope.
 * Used when the API returns a list of resources with pagination metadata.
 *
 * @example
 * // Server response for GET /api/reptiles?page=1&limit=10
 * {
 *   data: [...],
 *   meta: { page: 1, limit: 10, total: 50, totalPages: 5, hasNext: true, hasPrev: false }
 * }
 */
export interface PaginatedResponse<T> {
  data: T[]
  meta: PaginationMeta
}

/**
 * Pagination metadata included in list responses.
 */
export interface PaginationMeta {
  /** Current page number (1-indexed) */
  page: number
  /** Number of items per page */
  limit: number
  /** Total number of items across all pages */
  total: number
  /** Total number of pages */
  totalPages: number
  /** Whether there is a next page */
  hasNext: boolean
  /** Whether there is a previous page */
  hasPrev: boolean
}

/**
 * Standard delete response structure.
 * Returned when a resource is soft-deleted.
 */
export interface DeleteResponse {
  /** ID of the deleted resource */
  id: string
  /** ISO timestamp when the resource was marked as deleted */
  deletedAt: string
}

/**
 * Generic query parameters for list endpoints.
 * Individual API modules extend this with resource-specific filters.
 */
export interface BaseQueryParams {
  /** Page number for pagination (1-indexed) */
  page?: number
  /** Number of items per page */
  limit?: number
  /** Field to sort by */
  sortBy?: string
  /** Sort direction */
  sortOrder?: 'asc' | 'desc'
}
