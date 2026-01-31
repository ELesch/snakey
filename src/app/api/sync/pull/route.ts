// API Route: /api/sync/pull - GET (fetch changes since last sync)
import { NextRequest, NextResponse } from 'next/server'
import { getUserId } from '@/lib/supabase/server'
import { syncService } from '@/services/sync.service'
import { createLogger } from '@/lib/logger'

const log = createLogger('SyncPullAPI')

/**
 * GET /api/sync/pull - Get all changes since a given timestamp
 *
 * Query parameters:
 * - since: ISO timestamp or Unix timestamp (ms) of last sync
 *          If not provided, returns all records
 */
export async function GET(request: NextRequest) {
  try {
    const userId = await getUserId()

    if (!userId) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const sinceParam = searchParams.get('since')

    // Parse the since timestamp
    let since: Date
    if (!sinceParam) {
      // If no since provided, get all records (use epoch start)
      since = new Date(0)
    } else {
      // Try parsing as Unix timestamp (milliseconds)
      const timestamp = parseInt(sinceParam, 10)
      if (!isNaN(timestamp)) {
        since = new Date(timestamp)
      } else {
        // Try parsing as ISO string
        since = new Date(sinceParam)
      }

      // Validate the date
      if (isNaN(since.getTime())) {
        return NextResponse.json(
          {
            error: {
              code: 'INVALID_TIMESTAMP',
              message: 'Invalid since timestamp. Use ISO format or Unix timestamp (ms).',
            },
          },
          { status: 400 }
        )
      }
    }

    log.info({ userId, since }, 'Fetching changes since timestamp')

    const changes = await syncService.getChangesSince(userId, since)

    // Calculate total changes
    const totalChanges =
      changes.reptiles.length +
      changes.feedings.length +
      changes.sheds.length +
      changes.weights.length +
      changes.environmentLogs.length +
      changes.photos.length

    return NextResponse.json({
      data: {
        ...changes,
        summary: {
          reptiles: changes.reptiles.length,
          feedings: changes.feedings.length,
          sheds: changes.sheds.length,
          weights: changes.weights.length,
          environmentLogs: changes.environmentLogs.length,
          photos: changes.photos.length,
          total: totalChanges,
        },
      },
    })
  } catch (error) {
    log.error({ error }, 'Error fetching changes for pull sync')
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    )
  }
}
