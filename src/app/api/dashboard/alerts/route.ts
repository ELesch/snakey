// API Route: GET /api/dashboard/alerts - Environment alerts
import { NextRequest, NextResponse } from 'next/server'
import { getUserId } from '@/lib/supabase/server'
import { dashboardService } from '@/services/dashboard.service'
import { createLogger } from '@/lib/logger'

const log = createLogger('DashboardAlertsAPI')

/**
 * GET /api/dashboard/alerts - Get environment alerts for authenticated user
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

    const alerts = await dashboardService.getEnvironmentAlerts(userId)

    return NextResponse.json({ data: alerts })
  } catch (error) {
    log.error({ error }, 'Error fetching environment alerts')
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    )
  }
}
