// API Route: /api/sync/batch - POST (process multiple sync operations)
import { NextRequest, NextResponse } from 'next/server'
import { getUserId } from '@/lib/supabase/server'
import {
  syncService,
  type BatchSyncOperation,
  type SyncOperation,
} from '@/services/sync.service'
import { createLogger } from '@/lib/logger'
import { z } from 'zod'

const log = createLogger('SyncBatchAPI')

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

/**
 * POST /api/sync/batch - Process multiple sync operations
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId()

    if (!userId) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      )
    }

    const body = await request.json()

    // Validate request format
    const validationResult = BatchSyncSchema.safeParse(body)
    if (!validationResult.success) {
      const issues = validationResult.error.issues
      return NextResponse.json(
        {
          error: {
            code: 'INVALID_REQUEST',
            message: issues[0]?.message || 'Invalid batch sync request',
            details: issues,
          },
        },
        { status: 400 }
      )
    }

    const { operations: rawOperations } = validationResult.data

    // Validate all table names
    const validTables = [
      'reptiles',
      'feedings',
      'sheds',
      'weights',
      'environmentLogs',
      'photos',
    ]
    for (const op of rawOperations) {
      if (!validTables.includes(op.table)) {
        return NextResponse.json(
          {
            error: {
              code: 'INVALID_TABLE',
              message: `Unsupported table: ${op.table}`,
            },
          },
          { status: 400 }
        )
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

    log.info(
      { userId, operationCount: operations.length },
      'Processing batch sync'
    )

    const results = await syncService.processBatchSync(userId, operations)

    // Calculate summary
    const successCount = results.filter((r) => r.success).length
    const failureCount = results.filter((r) => !r.success).length
    const conflictCount = results.filter((r) => r.conflict).length

    return NextResponse.json({
      data: {
        results,
        summary: {
          total: results.length,
          success: successCount,
          failed: failureCount,
          conflicts: conflictCount,
        },
      },
    })
  } catch (error) {
    log.error({ error }, 'Error processing batch sync')
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    )
  }
}
