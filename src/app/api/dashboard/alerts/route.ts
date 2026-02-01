// API Route: GET /api/dashboard/alerts - Environment alerts
import { NextRequest } from 'next/server'
import { getUserId } from '@/lib/supabase/server'
import { dashboardService } from '@/services/dashboard.service'
import { withErrorHandler } from '@/lib/api/error-handler'
import { listResponse, unauthorizedResponse } from '@/lib/api/response'

/**
 * GET /api/dashboard/alerts - Get environment alerts for authenticated user
 */
export const GET = withErrorHandler(
  async (request: NextRequest) => {
    const userId = await getUserId()

    if (!userId) {
      return unauthorizedResponse()
    }

    const alerts = await dashboardService.getEnvironmentAlerts(userId)

    return listResponse(alerts)
  },
  'DashboardAlertsAPI'
)
