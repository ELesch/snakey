// API Route: /api/reptiles/[id]/photos - GET (list), POST (create)
import { NextRequest, NextResponse } from 'next/server'
import { getUserId } from '@/lib/supabase/server'
import {
  PhotoService,
  NotFoundError,
  ForbiddenError,
  ValidationError,
} from '@/services/photo.service'
import { PhotoQuerySchema } from '@/validations/photo'
import { createLogger } from '@/lib/logger'

const log = createLogger('PhotoAPI')
const photoService = new PhotoService()

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * GET /api/reptiles/[id]/photos - List all photos for a reptile
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: reptileId } = await params
    const userId = await getUserId()

    if (!userId) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      )
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams
    const queryResult = PhotoQuerySchema.safeParse({
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
      sort: searchParams.get('sort'),
      order: searchParams.get('order'),
      category: searchParams.get('category'),
      shedId: searchParams.get('shedId'),
      vetVisitId: searchParams.get('vetVisitId'),
    })

    if (!queryResult.success) {
      const issues = queryResult.error.issues || []
      return NextResponse.json(
        {
          error: {
            code: 'INVALID_QUERY_PARAMS',
            message: issues[0]?.message || 'Invalid query parameters',
            details: issues,
          },
        },
        { status: 400 }
      )
    }

    const result = await photoService.list(userId, reptileId, queryResult.data)

    return NextResponse.json(result)
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

    log.error({ error }, 'Error listing photos')
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    )
  }
}

/**
 * POST /api/reptiles/[id]/photos - Create a new photo
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: reptileId } = await params
    const userId = await getUserId()

    if (!userId) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      )
    }

    const body = await request.json()

    const photo = await photoService.create(userId, reptileId, body)

    return NextResponse.json({ data: photo }, { status: 201 })
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

    log.error({ error }, 'Error creating photo')
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    )
  }
}
