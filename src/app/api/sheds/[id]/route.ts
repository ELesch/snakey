// API Route: /api/sheds/[id] - GET, PUT, DELETE
import { NextRequest } from 'next/server'
import { getUserId } from '@/lib/supabase/server'
import { ShedService } from '@/services/shed.service'
import { withErrorHandler } from '@/lib/api/error-handler'
import { successResponse, unauthorizedResponse } from '@/lib/api/response'

const shedService = new ShedService()

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * GET /api/sheds/[id] - Get a single shed by ID
 */
export const GET = withErrorHandler(
  async (_request: NextRequest, { params }: RouteParams) => {
    const { id } = await params
    const userId = await getUserId()

    if (!userId) {
      return unauthorizedResponse()
    }

    const shed = await shedService.getById(userId, id)

    return successResponse(shed)
  },
  'ShedAPI'
)

/**
 * PUT /api/sheds/[id] - Update a shed
 */
export const PUT = withErrorHandler(
  async (request: NextRequest, { params }: RouteParams) => {
    const { id } = await params
    const userId = await getUserId()

    if (!userId) {
      return unauthorizedResponse()
    }

    const body = await request.json()
    const shed = await shedService.update(userId, id, body)

    return successResponse(shed)
  },
  'ShedAPI'
)

/**
 * DELETE /api/sheds/[id] - Delete a shed
 */
export const DELETE = withErrorHandler(
  async (_request: NextRequest, { params }: RouteParams) => {
    const { id } = await params
    const userId = await getUserId()

    if (!userId) {
      return unauthorizedResponse()
    }

    const result = await shedService.delete(userId, id)

    return successResponse(result)
  },
  'ShedAPI'
)
