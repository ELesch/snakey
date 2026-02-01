// API Route: GET /api/reports/environment - Environment statistics
import { NextRequest, NextResponse } from 'next/server'
import { getUserId } from '@/lib/supabase/server'
import { reportsService } from '@/services/reports.service'
import { withErrorHandler } from '@/lib/api/error-handler'
import { unauthorizedResponse } from '@/lib/api/response'

/**
 * GET /api/reports/environment - Get environment statistics
 *
 * Query params:
 * - reptileId (optional): Filter by specific reptile, or "all" for aggregate
 * - startDate (optional): ISO date string
 * - endDate (optional): ISO date string
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

  const result = await reportsService.getEnvironmentStats(userId, {
    reptileId,
    startDate,
    endDate,
  })

  return NextResponse.json({
    data: result.data,
    summary: result.summary,
  })
}, 'ReportsEnvironmentAPI')
