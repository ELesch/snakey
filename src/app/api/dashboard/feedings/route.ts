// API Route: GET /api/dashboard/feedings - Upcoming feedings
import { NextRequest } from 'next/server'
import { getUserId } from '@/lib/supabase/server'
import { dashboardService } from '@/services/dashboard.service'
import { withErrorHandler } from '@/lib/api/error-handler'
import { listResponse, unauthorizedResponse } from '@/lib/api/response'

/**
 * GET /api/dashboard/feedings - Get upcoming feedings for authenticated user
 */
export const GET = withErrorHandler(
  async (request: NextRequest) => {
    const userId = await getUserId()

    if (!userId) {
      return unauthorizedResponse()
    }

    // Parse optional days from query params (default 7)
    const searchParams = request.nextUrl.searchParams
    const days = parseInt(searchParams.get('days') ?? '7', 10)

    const feedings = await dashboardService.getUpcomingFeedings(
      userId,
      Math.min(days, 30) // Cap at 30 days
    )

    return listResponse(feedings)
  },
  'DashboardFeedingsAPI'
)
