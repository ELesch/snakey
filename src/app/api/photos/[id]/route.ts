// API Route: /api/photos/[id] - GET, PUT, DELETE
import { NextRequest } from 'next/server'
import { getUserId } from '@/lib/supabase/server'
import { PhotoService } from '@/services/photo.service'
import { withErrorHandler } from '@/lib/api/error-handler'
import { successResponse, unauthorizedResponse } from '@/lib/api/response'

const photoService = new PhotoService()

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * GET /api/photos/[id] - Get a single photo by ID
 */
export const GET = withErrorHandler(
  async (_request: NextRequest, { params }: RouteParams) => {
    const { id } = await params
    const userId = await getUserId()

    if (!userId) {
      return unauthorizedResponse()
    }

    const photo = await photoService.getById(userId, id)

    return successResponse(photo)
  },
  'PhotoAPI'
)

/**
 * PUT /api/photos/[id] - Update a photo
 */
export const PUT = withErrorHandler(
  async (request: NextRequest, { params }: RouteParams) => {
    const { id } = await params
    const userId = await getUserId()

    if (!userId) {
      return unauthorizedResponse()
    }

    const body = await request.json()

    const photo = await photoService.update(userId, id, body)

    return successResponse(photo)
  },
  'PhotoAPI'
)

/**
 * DELETE /api/photos/[id] - Delete a photo
 */
export const DELETE = withErrorHandler(
  async (_request: NextRequest, { params }: RouteParams) => {
    const { id } = await params
    const userId = await getUserId()

    if (!userId) {
      return unauthorizedResponse()
    }

    const result = await photoService.delete(userId, id)

    return successResponse(result)
  },
  'PhotoAPI'
)
