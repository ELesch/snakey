// API Route: /api/sync/pull - GET (fetch changes since last sync)
import { NextRequest } from 'next/server'
import { getUserId } from '@/lib/supabase/server'
import { syncService } from '@/services/sync.service'
import { withErrorHandler } from '@/lib/api/error-handler'
import {
  successResponse,
  unauthorizedResponse,
  validationErrorResponse,
} from '@/lib/api/response'

/**
 * GET /api/sync/pull - Get all changes since a given timestamp
 *
 * Query parameters:
 * - since: ISO timestamp or Unix timestamp (ms) of last sync
 *          If not provided, returns all records
 */
export const GET = withErrorHandler(async (request: NextRequest) => {
  const userId = await getUserId()

  if (!userId) {
    return unauthorizedResponse()
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
      return validationErrorResponse(
        'Invalid since timestamp. Use ISO format or Unix timestamp (ms).'
      )
    }
  }

  const changes = await syncService.getChangesSince(userId, since)

  // Calculate total changes
  const totalChanges =
    changes.reptiles.length +
    changes.feedings.length +
    changes.sheds.length +
    changes.weights.length +
    changes.environmentLogs.length +
    changes.photos.length

  return successResponse({
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
  })
}, 'SyncPullAPI')
