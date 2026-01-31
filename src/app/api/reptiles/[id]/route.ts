// API Route: /api/reptiles/[id] - GET, PUT, DELETE
import { NextRequest, NextResponse } from 'next/server'
import { getUserId } from '@/lib/supabase/server'
import {
  ReptileService,
  NotFoundError,
  ForbiddenError,
  ValidationError,
} from '@/services/reptile.service'
import { ReptileIncludeSchema } from '@/validations/reptile'
import { createLogger } from '@/lib/logger'

const log = createLogger('ReptileAPI')
const reptileService = new ReptileService()

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * GET /api/reptiles/[id] - Get a single reptile by ID
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const userId = await getUserId()

    if (!userId) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      )
    }

    // Parse include parameters
    const searchParams = request.nextUrl.searchParams
    const includeResult = ReptileIncludeSchema.safeParse({
      include: searchParams.get('include'),
      feedingsLimit: searchParams.get('feedingsLimit'),
      shedsLimit: searchParams.get('shedsLimit'),
      weightsLimit: searchParams.get('weightsLimit'),
      photosLimit: searchParams.get('photosLimit'),
    })

    if (!includeResult.success) {
      const issues = includeResult.error.issues || []
      return NextResponse.json(
        {
          error: {
            code: 'INVALID_QUERY_PARAMS',
            message: issues[0]?.message || 'Invalid query parameters',
          },
        },
        { status: 400 }
      )
    }

    // Build include options for repository
    const includeOptions = includeResult.data.include
      ? buildIncludeOptions(includeResult.data)
      : undefined

    const shareId = searchParams.get('shareId') || undefined

    const reptile = await reptileService.getById(userId, id, {
      shareId,
      include: includeOptions,
    })

    return NextResponse.json({ data: reptile })
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

    log.error({ error }, 'Error getting reptile')
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/reptiles/[id] - Update a reptile
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const userId = await getUserId()

    if (!userId) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      )
    }

    const body = await request.json()

    const reptile = await reptileService.update(userId, id, body)

    return NextResponse.json({ data: reptile })
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

    log.error({ error }, 'Error updating reptile')
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/reptiles/[id] - Soft delete a reptile
 */
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const userId = await getUserId()

    if (!userId) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      )
    }

    const result = await reptileService.softDelete(userId, id)

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

    log.error({ error }, 'Error deleting reptile')
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    )
  }
}

/**
 * Helper to build Prisma include options from validated query params
 */
function buildIncludeOptions(params: {
  include?: string[]
  feedingsLimit: number
  shedsLimit: number
  weightsLimit: number
  photosLimit: number
}) {
  const { include = [], feedingsLimit, shedsLimit, weightsLimit, photosLimit } = params

  const includeOptions: Record<string, boolean | object> = {}

  if (include.includes('feedings')) {
    includeOptions.feedings = {
      take: feedingsLimit,
      orderBy: { date: 'desc' as const },
    }
  }

  if (include.includes('sheds')) {
    includeOptions.sheds = {
      take: shedsLimit,
      orderBy: { completedDate: 'desc' as const },
    }
  }

  if (include.includes('weights')) {
    includeOptions.weights = {
      take: weightsLimit,
      orderBy: { date: 'desc' as const },
    }
  }

  if (include.includes('photos')) {
    includeOptions.photos = {
      take: photosLimit,
      orderBy: { takenAt: 'desc' as const },
    }
  }

  if (include.includes('vetVisits')) {
    includeOptions.vetVisits = {
      take: 10,
      orderBy: { date: 'desc' as const },
    }
  }

  if (include.includes('medications')) {
    includeOptions.medications = true
  }

  // Note: 'stats' would require additional computation, not direct include
  // This would be handled separately in the service layer

  return Object.keys(includeOptions).length > 0 ? includeOptions : undefined
}
