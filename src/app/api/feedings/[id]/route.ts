// API Route: /api/feedings/[id] - GET, PUT, DELETE
import { NextRequest } from 'next/server'
import { getUserId } from '@/lib/supabase/server'
import { FeedingService } from '@/services/feeding.service'
import { withErrorHandler } from '@/lib/api/error-handler'
import { successResponse, unauthorizedResponse } from '@/lib/api/response'

const feedingService = new FeedingService()

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * GET /api/feedings/[id] - Get a single feeding by ID
 */
export const GET = withErrorHandler(
  async (_request: NextRequest, { params }: RouteParams) => {
    const { id } = await params
    const userId = await getUserId()

    if (!userId) {
      return unauthorizedResponse()
    }

    const feeding = await feedingService.getById(userId, id)

    return successResponse(feeding)
  },
  'FeedingAPI'
)

/**
 * PUT /api/feedings/[id] - Update a feeding
 */
export const PUT = withErrorHandler(
  async (request: NextRequest, { params }: RouteParams) => {
    const { id } = await params
    const userId = await getUserId()

    if (!userId) {
      return unauthorizedResponse()
    }

    const body = await request.json()
    const feeding = await feedingService.update(userId, id, body)

    return successResponse(feeding)
  },
  'FeedingAPI'
)

/**
 * DELETE /api/feedings/[id] - Delete a feeding
 */
export const DELETE = withErrorHandler(
  async (_request: NextRequest, { params }: RouteParams) => {
    const { id } = await params
    const userId = await getUserId()

    if (!userId) {
      return unauthorizedResponse()
    }

    const result = await feedingService.delete(userId, id)

    return successResponse(result)
  },
  'FeedingAPI'
)
