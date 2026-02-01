// API Route: /api/sync/batch - POST (process multiple sync operations)
import { NextRequest } from 'next/server'
import { getUserId } from '@/lib/supabase/server'
import {
  syncService,
  type BatchSyncOperation,
  type SyncOperation,
} from '@/services/sync.service'
import { z } from 'zod'
import { withErrorHandler } from '@/lib/api/error-handler'
import {
  successResponse,
  unauthorizedResponse,
  validationErrorResponse,
} from '@/lib/api/response'

// Schema for validating batch sync operations
const SyncOperationSchema = z.object({
  operation: z.enum(['CREATE', 'UPDATE', 'DELETE']),
  recordId: z.string().min(1),
  payload: z.unknown(),
  clientTimestamp: z.number().optional(),
})

const BatchSyncSchema = z.object({
  operations: z.array(
    z.object({
      table: z.string().min(1),
      operation: SyncOperationSchema,
    })
  ),
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
 * POST /api/sync/batch - Process multiple sync operations
 */
export const POST = withErrorHandler(async (request: NextRequest) => {
  const userId = await getUserId()

  if (!userId) {
    return unauthorizedResponse()
  }

  const body = await request.json()

  // Validate request format
  const validationResult = BatchSyncSchema.safeParse(body)
  if (!validationResult.success) {
    const issues = validationResult.error.issues
    return validationErrorResponse(
      issues[0]?.message || 'Invalid batch sync request',
      issues
    )
  }

  const { operations: rawOperations } = validationResult.data

  // Validate all table names
  for (const op of rawOperations) {
    if (!validTables.includes(op.table)) {
      return validationErrorResponse(`Unsupported table: ${op.table}`)
    }
  }

  // Convert to typed operations
  const operations: BatchSyncOperation[] = rawOperations.map((op) => ({
    table: op.table,
    operation: {
      operation: op.operation.operation,
      recordId: op.operation.recordId,
      payload: op.operation.payload,
      clientTimestamp: op.operation.clientTimestamp ?? Date.now(),
    } as SyncOperation,
  }))

  const results = await syncService.processBatchSync(userId, operations)

  // Calculate summary
  const successCount = results.filter((r) => r.success).length
  const failureCount = results.filter((r) => !r.success).length
  const conflictCount = results.filter((r) => r.conflict).length

  return successResponse({
    results,
    summary: {
      total: results.length,
      success: successCount,
      failed: failureCount,
      conflicts: conflictCount,
    },
  })
}, 'SyncBatchAPI')
