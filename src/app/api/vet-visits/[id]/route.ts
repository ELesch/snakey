// API Route: /api/vet-visits/[id] - GET, PUT, DELETE
import { NextRequest } from 'next/server'
import { getUserId } from '@/lib/supabase/server'
import { VetService } from '@/services/vet.service'
import { withErrorHandler } from '@/lib/api/error-handler'
import { successResponse, unauthorizedResponse } from '@/lib/api/response'

const vetService = new VetService()

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * GET /api/vet-visits/[id] - Get a single vet visit by ID
 */
export const GET = withErrorHandler(
  async (_request: NextRequest, { params }: RouteParams) => {
    const { id } = await params
    const userId = await getUserId()

    if (!userId) {
      return unauthorizedResponse()
    }

    const visit = await vetService.getVisitById(userId, id)

    return successResponse(visit)
  },
  'VetVisitAPI'
)

/**
 * PUT /api/vet-visits/[id] - Update a vet visit
 */
export const PUT = withErrorHandler(
  async (request: NextRequest, { params }: RouteParams) => {
    const { id } = await params
    const userId = await getUserId()

    if (!userId) {
      return unauthorizedResponse()
    }

    const body = await request.json()

    const visit = await vetService.updateVisit(userId, id, body)

    return successResponse(visit)
  },
  'VetVisitAPI'
)

/**
 * DELETE /api/vet-visits/[id] - Delete a vet visit
 */
export const DELETE = withErrorHandler(
  async (_request: NextRequest, { params }: RouteParams) => {
    const { id } = await params
    const userId = await getUserId()

    if (!userId) {
      return unauthorizedResponse()
    }

    const result = await vetService.deleteVisit(userId, id)

    return successResponse(result)
  },
  'VetVisitAPI'
)
