// API Route: /api/clutches/[id] - GET, PUT, DELETE
import { NextRequest } from 'next/server'
import { getUserId } from '@/lib/supabase/server'
import { ClutchService } from '@/services/breeding.service'
import { withErrorHandler } from '@/lib/api/error-handler'
import {
  successResponse,
  unauthorizedResponse,
} from '@/lib/api/response'

const clutchService = new ClutchService()

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * GET /api/clutches/[id] - Get a single clutch by ID
 */
export const GET = withErrorHandler(
  async (_request: NextRequest, { params }: RouteParams) => {
    const { id } = await params
    const userId = await getUserId()

    if (!userId) {
      return unauthorizedResponse()
    }

    const clutch = await clutchService.getById(userId, id)

    return successResponse(clutch)
  },
  'ClutchAPI'
)

/**
 * PUT /api/clutches/[id] - Update a clutch
 */
export const PUT = withErrorHandler(
  async (request: NextRequest, { params }: RouteParams) => {
    const { id } = await params
    const userId = await getUserId()

    if (!userId) {
      return unauthorizedResponse()
    }

    const body = await request.json()
    const clutch = await clutchService.update(userId, id, body)

    return successResponse(clutch)
  },
  'ClutchAPI'
)

/**
 * DELETE /api/clutches/[id] - Delete a clutch
 */
export const DELETE = withErrorHandler(
  async (_request: NextRequest, { params }: RouteParams) => {
    const { id } = await params
    const userId = await getUserId()

    if (!userId) {
      return unauthorizedResponse()
    }

    const result = await clutchService.delete(userId, id)

    return successResponse(result)
  },
  'ClutchAPI'
)
