// API Response Utilities
// Provides consistent response format across all API endpoints

import { NextResponse } from 'next/server'

/**
 * Standard success response envelope
 */
export interface SuccessEnvelope<T> {
  data: T
  meta?: Record<string, unknown>
}

/**
 * Standard error response envelope
 */
export interface ErrorEnvelope {
  error: {
    code: string
    message: string
    details?: unknown
  }
}

/**
 * List response meta information
 */
export interface ListMeta {
  count: number
  page?: number
  pageSize?: number
  total?: number
  [key: string]: unknown
}

/**
 * Create a success response with data envelope
 *
 * @example
 * return successResponse({ id: '123', name: 'Test' })
 * // Returns: { data: { id: '123', name: 'Test' } }
 */
export function successResponse<T>(
  data: T,
  meta?: Record<string, unknown>,
  status: number = 200
): NextResponse<SuccessEnvelope<T>> {
  const body: SuccessEnvelope<T> = { data }

  if (meta) {
    body.meta = meta
  }

  return NextResponse.json(body, { status })
}

/**
 * Create an error response with error envelope
 *
 * @example
 * return errorResponse('NOT_FOUND', 'Reptile not found', 404)
 * // Returns: { error: { code: 'NOT_FOUND', message: 'Reptile not found' } }
 */
export function errorResponse(
  code: string,
  message: string,
  status: number,
  details?: unknown
): NextResponse<ErrorEnvelope> {
  const error: ErrorEnvelope['error'] = { code, message }

  if (details !== undefined) {
    error.details = details
  }

  return NextResponse.json({ error }, { status })
}

/**
 * Create a list response with data array and meta information
 *
 * @example
 * return listResponse(items, { page: 1, pageSize: 10, total: 100 })
 * // Returns: { data: [...], meta: { count: 10, page: 1, pageSize: 10, total: 100 } }
 */
export function listResponse<T>(
  data: T[],
  meta?: Omit<ListMeta, 'count'>
): NextResponse<SuccessEnvelope<T[]>> {
  const listMeta: ListMeta = {
    count: data.length,
    ...meta,
  }

  return NextResponse.json({ data, meta: listMeta }, { status: 200 })
}

// Common error response helpers
export const unauthorizedResponse = () =>
  errorResponse('UNAUTHORIZED', 'Authentication required', 401)

export const forbiddenResponse = (message: string = 'Access denied') =>
  errorResponse('FORBIDDEN', message, 403)

export const notFoundResponse = (message: string = 'Resource not found') =>
  errorResponse('NOT_FOUND', message, 404)

export const validationErrorResponse = (message: string, details?: unknown) =>
  errorResponse('VALIDATION_ERROR', message, 400, details)

export const invalidQueryParamsResponse = (message: string, details?: unknown) =>
  errorResponse('INVALID_QUERY_PARAMS', message, 400, details)

export const internalErrorResponse = () =>
  errorResponse('INTERNAL_ERROR', 'Internal server error', 500)
