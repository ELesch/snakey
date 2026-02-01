// API Route: /api/weights/[id] - GET, PUT, DELETE
import { NextRequest } from 'next/server'
import { getUserId } from '@/lib/supabase/server'
import { WeightService } from '@/services/weight.service'
import { withErrorHandler } from '@/lib/api/error-handler'
import { successResponse, unauthorizedResponse } from '@/lib/api/response'

const weightService = new WeightService()

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * GET /api/weights/[id] - Get a single weight by ID
 */
export const GET = withErrorHandler(
  async (_request: NextRequest, { params }: RouteParams) => {
    const { id } = await params
    const userId = await getUserId()

    if (!userId) {
      return unauthorizedResponse()
    }

    const weight = await weightService.getById(userId, id)

    return successResponse(weight)
  },
  'WeightAPI'
)

/**
 * PUT /api/weights/[id] - Update a weight record
 */
export const PUT = withErrorHandler(
  async (request: NextRequest, { params }: RouteParams) => {
    const { id } = await params
    const userId = await getUserId()

    if (!userId) {
      return unauthorizedResponse()
    }

    const body = await request.json()
    const weight = await weightService.update(userId, id, body)

    return successResponse(weight)
  },
  'WeightAPI'
)

/**
 * DELETE /api/weights/[id] - Delete a weight record
 */
export const DELETE = withErrorHandler(
  async (_request: NextRequest, { params }: RouteParams) => {
    const { id } = await params
    const userId = await getUserId()

    if (!userId) {
      return unauthorizedResponse()
    }

    const result = await weightService.delete(userId, id)

    return successResponse({ id: result.id, deleted: true })
  },
  'WeightAPI'
)
