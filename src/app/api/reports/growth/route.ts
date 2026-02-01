// API Route: GET /api/reports/growth - Weight/growth data for charting
import { NextRequest, NextResponse } from 'next/server'
import { getUserId } from '@/lib/supabase/server'
import { reportsService } from '@/services/reports.service'
import { withErrorHandler } from '@/lib/api/error-handler'
import { unauthorizedResponse } from '@/lib/api/response'

/**
 * GET /api/reports/growth - Get weight data points for charting
 *
 * Query params:
 * - reptileId (optional): Filter by specific reptile, or "all" for aggregate
 * - startDate (optional): ISO date string
 * - endDate (optional): ISO date string
 * - limit (optional): Max records to return (default 100, max 1000)
 * - offset (optional): Number of records to skip (default 0)
 */
export const GET = withErrorHandler(async (request: NextRequest) => {
  const userId = await getUserId()

  if (!userId) {
    return unauthorizedResponse()
  }

  const searchParams = request.nextUrl.searchParams
  const reptileId = searchParams.get('reptileId') ?? undefined
  const startDate = searchParams.get('startDate') ?? undefined
  const endDate = searchParams.get('endDate') ?? undefined
  const limitParam = searchParams.get('limit')
  const offsetParam = searchParams.get('offset')

  const limit = limitParam ? parseInt(limitParam, 10) : undefined
  const offset = offsetParam ? parseInt(offsetParam, 10) : undefined

  const result = await reportsService.getGrowthData(
    userId,
    { reptileId, startDate, endDate },
    { limit, offset }
  )

  return NextResponse.json({
    data: result.data,
    meta: result.meta,
  })
}, 'ReportsGrowthAPI')
