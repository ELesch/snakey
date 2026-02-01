/**
 * Shared API Client Utilities
 *
 * This module provides common utility functions used across all API client modules.
 * Import these utilities instead of duplicating code in each API module.
 */

import type { ErrorResponse } from './types'

/**
 * Unified API error class.
 *
 * Replaces resource-specific error classes (ReptileApiError, FeedingApiError, etc.)
 * with a single, consistent error class that can be used throughout the application.
 *
 * @example
 * try {
 *   const reptile = await fetchReptile(id)
 * } catch (error) {
 *   if (error instanceof ApiClientError) {
 *     console.log(error.code, error.status)
 *   }
 * }
 */
export class ApiClientError extends Error {
  /** Machine-readable error code (e.g., 'NOT_FOUND', 'VALIDATION_ERROR') */
  code: string

  /** HTTP status code from the response */
  status: number

  /** Resource type that caused the error (optional, for debugging) */
  resource?: string

  constructor(code: string, message: string, status: number, resource?: string) {
    super(message)
    this.name = 'ApiClientError'
    this.code = code
    this.status = status
    this.resource = resource
  }

  /**
   * Check if error is a specific type
   */
  isNotFound(): boolean {
    return this.code === 'NOT_FOUND' || this.status === 404
  }

  isUnauthorized(): boolean {
    return this.code === 'UNAUTHORIZED' || this.status === 401
  }

  isForbidden(): boolean {
    return this.code === 'FORBIDDEN' || this.status === 403
  }

  isValidationError(): boolean {
    return this.code === 'VALIDATION_ERROR' || this.status === 400
  }

  isServerError(): boolean {
    return this.status >= 500
  }
}

/**
 * Type guard to check if a response is an error response.
 *
 * @param response - The parsed JSON response from the API
 * @returns True if the response matches the ErrorResponse structure
 *
 * @example
 * const data = await response.json()
 * if (isErrorResponse(data)) {
 *   throw new ApiClientError(data.error.code, data.error.message, response.status)
 * }
 */
export function isErrorResponse(response: unknown): response is ErrorResponse {
  return (
    typeof response === 'object' &&
    response !== null &&
    'error' in response &&
    typeof (response as ErrorResponse).error === 'object' &&
    (response as ErrorResponse).error !== null &&
    'code' in (response as ErrorResponse).error &&
    'message' in (response as ErrorResponse).error
  )
}

/**
 * Handle API response with consistent error handling.
 *
 * Parses the response JSON and throws an ApiClientError if the response
 * indicates an error. Otherwise, returns the parsed data.
 *
 * @param response - The fetch Response object
 * @param resource - Optional resource name for error context
 * @returns The parsed response data of type T
 * @throws ApiClientError if the response is not ok
 *
 * @example
 * const response = await fetch('/api/reptiles/123')
 * const data = await handleResponse<SingleResponse<Reptile>>(response, 'reptile')
 */
export async function handleResponse<T>(
  response: Response,
  resource?: string
): Promise<T> {
  const data = await response.json()

  if (!response.ok) {
    if (isErrorResponse(data)) {
      throw new ApiClientError(
        data.error.code,
        data.error.message,
        response.status,
        resource
      )
    }
    throw new ApiClientError(
      'UNKNOWN_ERROR',
      'An unexpected error occurred',
      response.status,
      resource
    )
  }

  return data as T
}

/**
 * Build URL query string from a params object.
 *
 * Handles various value types:
 * - Strings, numbers, booleans: converted to string
 * - Arrays: joined with commas
 * - Dates: converted to ISO string
 * - undefined, null, empty string: skipped
 *
 * @param params - Object of query parameters
 * @returns Query string starting with '?' or empty string if no params
 *
 * @example
 * buildQueryString({ page: 1, species: ['ball_python', 'corn_snake'], name: undefined })
 * // Returns: '?page=1&species=ball_python,corn_snake'
 */
export function buildQueryString(params: Record<string, unknown>): string {
  const searchParams = new URLSearchParams()

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      if (Array.isArray(value)) {
        searchParams.set(key, value.join(','))
      } else if (value instanceof Date) {
        searchParams.set(key, value.toISOString())
      } else if (typeof value === 'boolean') {
        searchParams.set(key, value.toString())
      } else {
        searchParams.set(key, String(value))
      }
    }
  })

  const queryString = searchParams.toString()
  return queryString ? `?${queryString}` : ''
}

/**
 * Create request headers for JSON API calls.
 *
 * @param additionalHeaders - Optional additional headers to merge
 * @returns Headers object with Content-Type set to application/json
 */
export function createJsonHeaders(
  additionalHeaders?: Record<string, string>
): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    ...additionalHeaders,
  }
}

/**
 * Standard fetch options for POST/PUT requests with JSON body.
 *
 * @param method - HTTP method ('POST' | 'PUT' | 'PATCH')
 * @param body - Request body to serialize as JSON
 * @returns RequestInit options for fetch
 */
export function createJsonRequestOptions(
  method: 'POST' | 'PUT' | 'PATCH',
  body: unknown
): RequestInit {
  return {
    method,
    headers: createJsonHeaders(),
    body: JSON.stringify(body),
  }
}
