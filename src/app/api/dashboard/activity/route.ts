// API Route: GET /api/dashboard/activity - Recent activity feed
import { NextRequest } from 'next/server'
import { getUserId } from '@/lib/supabase/server'
import { dashboardService } from '@/services/dashboard.service'
import { withErrorHandler } from '@/lib/api/error-handler'
import { listResponse, unauthorizedResponse } from '@/lib/api/response'

/**
 * GET /api/dashboard/activity - Get recent activity for authenticated user
 */
export const GET = withErrorHandler(
  async (request: NextRequest) => {
    const userId = await getUserId()

    if (!userId) {
      return unauthorizedResponse()
    }

    // Parse optional limit from query params
    const searchParams = request.nextUrl.searchParams
    const limit = parseInt(searchParams.get('limit') ?? '10', 10)

    const activity = await dashboardService.getRecentActivity(
      userId,
      Math.min(limit, 50) // Cap at 50
    )

    return listResponse(activity)
  },
  'DashboardActivityAPI'
)
