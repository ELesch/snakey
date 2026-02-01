// Pagination Utility Functions
// Centralized helpers for generating consistent pagination metadata

import type { PaginationMeta } from '@/types/pagination'

/**
 * Parameters for generating pagination metadata
 */
export interface PaginationParams {
  /** Total number of items across all pages */
  total: number
  /** Current page number (1-indexed) */
  page: number
  /** Number of items per page */
  limit: number
}

/**
 * Generates consistent pagination metadata from total count and current page info.
 *
 * @param params - Pagination parameters (total, page, limit)
 * @returns PaginationMeta object with calculated pagination values
 *
 * @example
 * ```typescript
 * const meta = createPaginationMeta({ total: 100, page: 2, limit: 20 })
 * // Returns: { page: 2, limit: 20, total: 100, totalPages: 5, hasNext: true, hasPrev: true }
 * ```
 */
export function createPaginationMeta(params: PaginationParams): PaginationMeta {
  const { total, page, limit } = params
  const totalPages = Math.ceil(total / limit)

  return {
    page,
    limit,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  }
}

/**
 * Calculates the skip value for database queries based on page and limit.
 *
 * @param page - Current page number (1-indexed)
 * @param limit - Number of items per page
 * @returns Number of items to skip for the database query
 *
 * @example
 * ```typescript
 * const skip = calculateSkip(3, 20) // Returns 40
 * ```
 */
export function calculateSkip(page: number, limit: number): number {
  return (page - 1) * limit
}
