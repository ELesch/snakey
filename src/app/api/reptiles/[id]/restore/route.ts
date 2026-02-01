// API Route: /api/reptiles/[id]/restore - POST (restore soft-deleted)
import { NextRequest } from 'next/server'
import { getUserId } from '@/lib/supabase/server'
import { ReptileService } from '@/services/reptile.service'
import { withErrorHandler } from '@/lib/api/error-handler'
import { successResponse, unauthorizedResponse } from '@/lib/api/response'

const reptileService = new ReptileService()

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * POST /api/reptiles/[id]/restore - Restore a soft-deleted reptile
 */
export const POST = withErrorHandler(
  async (_request: NextRequest, { params }: RouteParams) => {
    const { id } = await params
    const userId = await getUserId()

    if (!userId) {
      return unauthorizedResponse()
    }

    const reptile = await reptileService.restore(userId, id)

    return successResponse(reptile)
  },
  'ReptileAPI'
)
