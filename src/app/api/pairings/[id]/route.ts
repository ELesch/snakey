// API Route: /api/pairings/[id] - GET, PUT, DELETE
import { NextRequest } from 'next/server'
import { getUserId } from '@/lib/supabase/server'
import { PairingService } from '@/services/breeding.service'
import { withErrorHandler } from '@/lib/api/error-handler'
import {
  successResponse,
  unauthorizedResponse,
} from '@/lib/api/response'

const pairingService = new PairingService()

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * GET /api/pairings/[id] - Get a single pairing by ID
 */
export const GET = withErrorHandler(
  async (_request: NextRequest, { params }: RouteParams) => {
    const { id } = await params
    const userId = await getUserId()

    if (!userId) {
      return unauthorizedResponse()
    }

    const pairing = await pairingService.getById(userId, id)

    return successResponse(pairing)
  },
  'PairingAPI'
)

/**
 * PUT /api/pairings/[id] - Update a pairing
 */
export const PUT = withErrorHandler(
  async (request: NextRequest, { params }: RouteParams) => {
    const { id } = await params
    const userId = await getUserId()

    if (!userId) {
      return unauthorizedResponse()
    }

    const body = await request.json()
    const pairing = await pairingService.update(userId, id, body)

    return successResponse(pairing)
  },
  'PairingAPI'
)

/**
 * DELETE /api/pairings/[id] - Delete a pairing
 */
export const DELETE = withErrorHandler(
  async (_request: NextRequest, { params }: RouteParams) => {
    const { id } = await params
    const userId = await getUserId()

    if (!userId) {
      return unauthorizedResponse()
    }

    const result = await pairingService.delete(userId, id)

    return successResponse(result)
  },
  'PairingAPI'
)
