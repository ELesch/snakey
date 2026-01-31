// API Route: GET /api/dashboard/stats - Collection stats
import { NextRequest, NextResponse } from 'next/server'
import { getUserId } from '@/lib/supabase/server'
import { dashboardService } from '@/services/dashboard.service'
import { createLogger } from '@/lib/logger'

const log = createLogger('DashboardStatsAPI')

/**
 * GET /api/dashboard/stats - Get dashboard stats for authenticated user
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

    const stats = await dashboardService.getStats(userId)

    return NextResponse.json({ data: stats })
  } catch (error) {
    log.error({ error }, 'Error fetching dashboard stats')
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    )
  }
}
