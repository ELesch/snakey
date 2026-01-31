// API Route: GET /api/dashboard/activity - Recent activity feed
import { NextRequest, NextResponse } from 'next/server'
import { getUserId } from '@/lib/supabase/server'
import { dashboardService } from '@/services/dashboard.service'
import { createLogger } from '@/lib/logger'

const log = createLogger('DashboardActivityAPI')

/**
 * GET /api/dashboard/activity - Get recent activity for authenticated user
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

    // Parse optional limit from query params
    const searchParams = request.nextUrl.searchParams
    const limit = parseInt(searchParams.get('limit') ?? '10', 10)

    const activity = await dashboardService.getRecentActivity(
      userId,
      Math.min(limit, 50) // Cap at 50
    )

    return NextResponse.json({ data: activity })
  } catch (error) {
    log.error({ error }, 'Error fetching recent activity')
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    )
  }
}
