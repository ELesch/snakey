// API Route: GET /api/reports/summary - Summary metrics for dashboard cards
import { NextRequest, NextResponse } from 'next/server'
import { getUserId } from '@/lib/supabase/server'
import { reportsService } from '@/services/reports.service'
import { createLogger } from '@/lib/logger'

const log = createLogger('ReportsSummaryAPI')

/**
 * GET /api/reports/summary - Get summary metrics for dashboard cards
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

    const summary = await reportsService.getSummary(userId)

    return NextResponse.json({ data: summary })
  } catch (error) {
    log.error({ error }, 'Error fetching reports summary')
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    )
  }
}
