// Centralized Error Handler for API Routes
// Wraps route handlers to provide consistent error handling

import { NextRequest, NextResponse } from 'next/server'
import { createLogger } from '@/lib/logger'
import {
  NotFoundError,
  ForbiddenError,
  ValidationError,
  StorageError,
  SyncValidationError,
  SyncNotFoundError,
  SyncForbiddenError,
  SyncConflictError,
} from '@/lib/errors'
import { errorResponse } from './response'

/**
 * Route handler function type without context
 */
export type RouteHandlerNoContext = (
  request: NextRequest
) => Promise<NextResponse>

/**
 * Route handler function type with context
 */
export type RouteHandlerWithContext<T> = (
  request: NextRequest,
  context: T
) => Promise<NextResponse>

/**
 * Wraps a route handler with centralized error handling (no context)
 *
 * @example
 * export const GET = withErrorHandler(async (request) => {
 *   const data = await service.list()
 *   return successResponse(data)
 * }, 'ApiName')
 */
export function withErrorHandler(
  handler: RouteHandlerNoContext,
  logContext: string
): RouteHandlerNoContext

/**
 * Wraps a route handler with centralized error handling (with context)
 *
 * @example
 * export const GET = withErrorHandler(async (request, { params }) => {
 *   const { id } = await params
 *   const data = await service.findById(id)
 *   return successResponse(data)
 * }, 'ApiName')
 */
export function withErrorHandler<T>(
  handler: RouteHandlerWithContext<T>,
  logContext: string
): RouteHandlerWithContext<T>

/**
 * Implementation
 */
export function withErrorHandler<T>(
  handler: RouteHandlerNoContext | RouteHandlerWithContext<T>,
  logContext: string
): RouteHandlerNoContext | RouteHandlerWithContext<T> {
  const log = createLogger(logContext)

  return async (request: NextRequest, context?: T): Promise<NextResponse> => {
    try {
      if (context !== undefined) {
        return await (handler as RouteHandlerWithContext<T>)(request, context)
      }
      return await (handler as RouteHandlerNoContext)(request)
    } catch (error) {
      if (error instanceof NotFoundError) {
        return errorResponse('NOT_FOUND', error.message, 404)
      }

      if (error instanceof ForbiddenError) {
        return errorResponse('FORBIDDEN', error.message, 403)
      }

      if (error instanceof ValidationError) {
        return errorResponse('VALIDATION_ERROR', error.message, 400)
      }

      if (error instanceof StorageError) {
        return errorResponse('STORAGE_ERROR', error.message, 500)
      }

      // Sync-specific errors
      if (error instanceof SyncValidationError) {
        return errorResponse('SYNC_VALIDATION_ERROR', error.message, 400)
      }

      if (error instanceof SyncNotFoundError) {
        return errorResponse('SYNC_NOT_FOUND', error.message, 404)
      }

      if (error instanceof SyncForbiddenError) {
        return errorResponse('SYNC_FORBIDDEN', error.message, 403)
      }

      if (error instanceof SyncConflictError) {
        return errorResponse('SYNC_CONFLICT', error.message, 409)
      }

      // Log unexpected errors
      log.error({ error }, 'Unhandled error in route handler')

      return errorResponse('INTERNAL_ERROR', 'Internal server error', 500)
    }
  }
}
