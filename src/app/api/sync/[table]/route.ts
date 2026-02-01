// API Route: /api/sync/[table] - POST (process single sync operation)
import { NextRequest, NextResponse } from 'next/server'
import { getUserId } from '@/lib/supabase/server'
import { syncService, type SyncOperation } from '@/services/sync.service'
import { z } from 'zod'
import { withErrorHandler } from '@/lib/api/error-handler'
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
  validationErrorResponse,
} from '@/lib/api/response'

// Schema for validating sync operations
const SyncOperationSchema = z.object({
  operation: z.enum(['CREATE', 'UPDATE', 'DELETE']),
  recordId: z.string().min(1),
  payload: z.unknown(),
  clientTimestamp: z.number().optional(),
})

const validTables = [
  'reptiles',
  'feedings',
  'sheds',
  'weights',
  'environmentLogs',
  'photos',
]

/**
 * POST /api/sync/[table] - Process a sync operation for a specific table
 */
export const POST = withErrorHandler(
  async (
    request: NextRequest,
    { params }: { params: Promise<{ table: string }> }
  ) => {
    const userId = await getUserId()

    if (!userId) {
      return unauthorizedResponse()
    }

    const { table } = await params

    // Validate table name
    if (!validTables.includes(table)) {
      return validationErrorResponse(`Unsupported table: ${table}`)
    }

    const body = await request.json()

    // Validate operation format
    const validationResult = SyncOperationSchema.safeParse(body)
    if (!validationResult.success) {
      const issues = validationResult.error.issues
      return validationErrorResponse(
        issues[0]?.message || 'Invalid sync operation',
        issues
      )
    }

    const operation: SyncOperation = {
      operation: validationResult.data.operation,
      recordId: validationResult.data.recordId,
      payload: validationResult.data.payload,
      clientTimestamp: validationResult.data.clientTimestamp ?? Date.now(),
    }

    const result = await syncService.processSyncOperation(userId, table, operation)

    // Return appropriate status based on result
    if (result.success) {
      return successResponse(result)
    }

    // Handle specific error types from sync service
    if (result.conflict) {
      return NextResponse.json(
        {
          data: result,
          message: 'Conflict detected - server record is newer',
        },
        { status: 409 }
      )
    }

    if (result.errorType === 'NOT_FOUND') {
      return errorResponse('NOT_FOUND', result.error || 'Record not found', 404)
    }

    if (result.errorType === 'FORBIDDEN') {
      return errorResponse('FORBIDDEN', result.error || 'Access denied', 403)
    }

    if (result.errorType === 'VALIDATION_ERROR') {
      return errorResponse('VALIDATION_ERROR', result.error || 'Validation failed', 400)
    }

    // Generic sync error
    return errorResponse('SYNC_ERROR', result.error || 'Sync operation failed', 500)
  },
  'SyncTableAPI'
)
