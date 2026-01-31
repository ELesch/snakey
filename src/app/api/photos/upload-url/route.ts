// API Route: /api/photos/upload-url - POST (get signed upload URL)
import { NextRequest, NextResponse } from 'next/server'
import { getUserId } from '@/lib/supabase/server'
import {
  PhotoService,
  NotFoundError,
  ForbiddenError,
  ValidationError,
  StorageError,
} from '@/services/photo.service'
import { createLogger } from '@/lib/logger'

const log = createLogger('PhotoUploadAPI')
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
export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId()

    if (!userId) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { reptileId, ...uploadData } = body

    if (!reptileId) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'reptileId is required' } },
        { status: 400 }
      )
    }

    const result = await photoService.getUploadUrl(userId, reptileId, uploadData)

    return NextResponse.json({ data: result })
  } catch (error) {
    if (error instanceof NotFoundError) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: error.message } },
        { status: 404 }
      )
    }

    if (error instanceof ForbiddenError) {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: error.message } },
        { status: 403 }
      )
    }

    if (error instanceof ValidationError) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: error.message } },
        { status: 400 }
      )
    }

    if (error instanceof StorageError) {
      return NextResponse.json(
        { error: { code: 'STORAGE_ERROR', message: error.message } },
        { status: 500 }
      )
    }

    log.error({ error }, 'Error generating upload URL')
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    )
  }
}
