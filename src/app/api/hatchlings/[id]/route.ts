// API Route: /api/hatchlings/[id] - GET, PUT, DELETE
import { NextRequest } from 'next/server'
import { getUserId } from '@/lib/supabase/server'
import { HatchlingService } from '@/services/breeding.service'
import { withErrorHandler } from '@/lib/api/error-handler'
import {
  successResponse,
  unauthorizedResponse,
} from '@/lib/api/response'

const hatchlingService = new HatchlingService()

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * GET /api/hatchlings/[id] - Get a single hatchling by ID
 */
export const GET = withErrorHandler(
  async (_request: NextRequest, { params }: RouteParams) => {
    const { id } = await params
    const userId = await getUserId()

    if (!userId) {
      return unauthorizedResponse()
    }

    const hatchling = await hatchlingService.getById(userId, id)

    return successResponse(hatchling)
  },
  'HatchlingAPI'
)

/**
 * PUT /api/hatchlings/[id] - Update a hatchling
 */
export const PUT = withErrorHandler(
  async (request: NextRequest, { params }: RouteParams) => {
    const { id } = await params
    const userId = await getUserId()

    if (!userId) {
      return unauthorizedResponse()
    }

    const body = await request.json()
    const hatchling = await hatchlingService.update(userId, id, body)

    return successResponse(hatchling)
  },
  'HatchlingAPI'
)

/**
 * DELETE /api/hatchlings/[id] - Delete a hatchling
 */
export const DELETE = withErrorHandler(
  async (_request: NextRequest, { params }: RouteParams) => {
    const { id } = await params
    const userId = await getUserId()

    if (!userId) {
      return unauthorizedResponse()
    }

    const result = await hatchlingService.delete(userId, id)

    return successResponse(result)
  },
  'HatchlingAPI'
)
