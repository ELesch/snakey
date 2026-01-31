// API Route: /api/reptiles/[id]/environment - GET list, POST create
import { NextRequest, NextResponse } from 'next/server'
import { getUserId } from '@/lib/supabase/server'
import {
  EnvironmentService,
  NotFoundError,
  ForbiddenError,
  ValidationError,
} from '@/services/environment.service'
import { EnvironmentQuerySchema } from '@/validations/environment'
import { createLogger } from '@/lib/logger'

const log = createLogger('EnvironmentAPI')
const environmentService = new EnvironmentService()

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * GET /api/reptiles/[id]/environment - List environment logs for a reptile
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
    const queryResult = EnvironmentQuerySchema.safeParse({
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
      sort: searchParams.get('sort'),
      order: searchParams.get('order'),
      startDate: searchParams.get('startDate'),
      endDate: searchParams.get('endDate'),
      location: searchParams.get('location'),
      alertsOnly: searchParams.get('alertsOnly'),
    })

    if (!queryResult.success) {
      const issues = queryResult.error.issues || []
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

    const result = await environmentService.list(userId, reptileId, queryResult.data)

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

    log.error({ error }, 'Error listing environment logs')
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    )
  }
}

/**
 * POST /api/reptiles/[id]/environment - Create a new environment log
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

    const envLog = await environmentService.create(userId, reptileId, body)

    return NextResponse.json({ data: envLog }, { status: 201 })
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

    log.error({ error }, 'Error creating environment log')
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    )
  }
}
