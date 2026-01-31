// API Route: /api/sync/[table] - POST (process single sync operation)
import { NextRequest, NextResponse } from 'next/server'
import { getUserId } from '@/lib/supabase/server'
import { syncService, type SyncOperation } from '@/services/sync.service'
import { createLogger } from '@/lib/logger'
import { z } from 'zod'

const log = createLogger('SyncTableAPI')

// Schema for validating sync operations
const SyncOperationSchema = z.object({
  operation: z.enum(['CREATE', 'UPDATE', 'DELETE']),
  recordId: z.string().min(1),
  payload: z.unknown(),
  clientTimestamp: z.number().optional(),
})

/**
 * POST /api/sync/[table] - Process a sync operation for a specific table
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ table: string }> }
) {
  try {
    const userId = await getUserId()

    if (!userId) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      )
    }

    const { table } = await params

    // Validate table name
    const validTables = [
      'reptiles',
      'feedings',
      'sheds',
      'weights',
      'environmentLogs',
      'photos',
    ]
    if (!validTables.includes(table)) {
      return NextResponse.json(
        { error: { code: 'INVALID_TABLE', message: `Unsupported table: ${table}` } },
        { status: 400 }
      )
    }

    const body = await request.json()

    // Validate operation format
    const validationResult = SyncOperationSchema.safeParse(body)
    if (!validationResult.success) {
      const issues = validationResult.error.issues
      return NextResponse.json(
        {
          error: {
            code: 'INVALID_OPERATION',
            message: issues[0]?.message || 'Invalid sync operation',
            details: issues,
          },
        },
        { status: 400 }
      )
    }

    const operation: SyncOperation = {
      operation: validationResult.data.operation,
      recordId: validationResult.data.recordId,
      payload: validationResult.data.payload,
      clientTimestamp: validationResult.data.clientTimestamp ?? Date.now(),
    }

    log.info(
      { userId, table, operation: operation.operation, recordId: operation.recordId },
      'Processing sync operation'
    )

    const result = await syncService.processSyncOperation(userId, table, operation)

    // Return appropriate status based on result
    if (result.success) {
      return NextResponse.json({ data: result })
    }

    // Handle specific error types
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
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: result.error } },
        { status: 404 }
      )
    }

    if (result.errorType === 'FORBIDDEN') {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: result.error } },
        { status: 403 }
      )
    }

    if (result.errorType === 'VALIDATION_ERROR') {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: result.error } },
        { status: 400 }
      )
    }

    // Generic error
    return NextResponse.json(
      { error: { code: 'SYNC_ERROR', message: result.error } },
      { status: 500 }
    )
  } catch (error) {
    log.error({ error }, 'Error processing sync operation')

    if (error instanceof Error && error.message.startsWith('Unsupported table')) {
      return NextResponse.json(
        { error: { code: 'INVALID_TABLE', message: error.message } },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    )
  }
}
