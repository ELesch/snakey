// API Route: GET /api/dashboard/stats - Collection stats
import { NextRequest } from 'next/server'
import { getUserId } from '@/lib/supabase/server'
import { dashboardService } from '@/services/dashboard.service'
import { withErrorHandler } from '@/lib/api/error-handler'
import { successResponse, unauthorizedResponse } from '@/lib/api/response'

/**
 * GET /api/dashboard/stats - Get dashboard stats for authenticated user
 */
export const GET = withErrorHandler(
  async (request: NextRequest) => {
    const userId = await getUserId()

    if (!userId) {
      return unauthorizedResponse()
    }

    const stats = await dashboardService.getStats(userId)

    return successResponse(stats)
  },
  'DashboardStatsAPI'
)
