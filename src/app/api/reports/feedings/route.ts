// API Route: GET /api/reports/feedings - Feeding statistics
import { NextRequest, NextResponse } from 'next/server'
import { getUserId } from '@/lib/supabase/server'
import { reportsService } from '@/services/reports.service'
import { createLogger } from '@/lib/logger'

const log = createLogger('ReportsFeedingsAPI')

/**
 * GET /api/reports/feedings - Get feeding statistics
 *
 * Query params:
 * - reptileId (optional): Filter by specific reptile, or "all" for aggregate
 * - startDate (optional): ISO date string
 * - endDate (optional): ISO date string
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
    const reptileId = searchParams.get('reptileId') ?? undefined
    const startDate = searchParams.get('startDate') ?? undefined
    const endDate = searchParams.get('endDate') ?? undefined

    const result = await reportsService.getFeedingStats(userId, {
      reptileId,
      startDate,
      endDate,
    })

    return NextResponse.json({
      data: result.data,
      summary: result.summary,
    })
  } catch (error) {
    log.error({ error }, 'Error fetching feeding stats')
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    )
  }
}
