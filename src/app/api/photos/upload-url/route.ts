// API Route: /api/photos/upload-url - POST (get signed upload URL)
import { NextRequest } from 'next/server'
import { getUserId } from '@/lib/supabase/server'
import { PhotoService } from '@/services/photo.service'
import { withErrorHandler } from '@/lib/api/error-handler'
import {
  successResponse,
  unauthorizedResponse,
  validationErrorResponse,
} from '@/lib/api/response'

const photoService = new PhotoService()

/**
 * POST /api/photos/upload-url - Get a signed upload URL
 *
 * Request body:
 * {
 *   reptileId: string,
 *   filename: string,
 *   contentType: string
 * }
 */
export const POST = withErrorHandler(async (request: NextRequest) => {
  const userId = await getUserId()

  if (!userId) {
    return unauthorizedResponse()
  }

  const body = await request.json()
  const { reptileId, ...uploadData } = body

  if (!reptileId) {
    return validationErrorResponse('reptileId is required')
  }

  const result = await photoService.getUploadUrl(userId, reptileId, uploadData)

  return successResponse(result)
}, 'PhotoUploadAPI')
