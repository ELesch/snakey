// API Route: GET /api/reports/summary - Summary metrics for dashboard cards
import { NextRequest } from 'next/server'
import { getUserId } from '@/lib/supabase/server'
import { reportsService } from '@/services/reports.service'
import { withErrorHandler } from '@/lib/api/error-handler'
import { successResponse, unauthorizedResponse } from '@/lib/api/response'

/**
 * GET /api/reports/summary - Get summary metrics for dashboard cards
 */
export const GET = withErrorHandler(async (_request: NextRequest) => {
  const userId = await getUserId()

  if (!userId) {
    return unauthorizedResponse()
  }

  const summary = await reportsService.getSummary(userId)

  return successResponse(summary)
}, 'ReportsSummaryAPI')
