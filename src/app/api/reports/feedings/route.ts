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
 * - limit (optional): Max records to return (default 100, max 1000)
 * - offset (optional): Number of records to skip (default 0)
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
    const limitParam = searchParams.get('limit')
    const offsetParam = searchParams.get('offset')

    const limit = limitParam ? parseInt(limitParam, 10) : undefined
    const offset = offsetParam ? parseInt(offsetParam, 10) : undefined

    const result = await reportsService.getFeedingStats(
      userId,
      { reptileId, startDate, endDate },
      { limit, offset }
    )

    return NextResponse.json({
      data: result.data,
      summary: result.summary,
      meta: result.meta,
    })
  } catch (error) {
    log.error({ error }, 'Error fetching feeding stats')
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    )
  }
}
