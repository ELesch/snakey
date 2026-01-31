// API Route: /api/clutches/[id]/hatchlings - GET (list), POST (create)
import { NextRequest, NextResponse } from 'next/server'
import { getUserId } from '@/lib/supabase/server'
import {
  HatchlingService,
  NotFoundError,
  ForbiddenError,
  ValidationError,
} from '@/services/breeding.service'
import { HatchlingQuerySchema } from '@/validations/breeding'
import { createLogger } from '@/lib/logger'

const log = createLogger('HatchlingAPI')
const hatchlingService = new HatchlingService()

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * GET /api/clutches/[id]/hatchlings - List all hatchlings for a clutch
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: clutchId } = await params
    const userId = await getUserId()

    if (!userId) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      )
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams
    const queryResult = HatchlingQuerySchema.safeParse({
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
      sort: searchParams.get('sort'),
      order: searchParams.get('order'),
      status: searchParams.get('status'),
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

    const result = await hatchlingService.list(userId, clutchId, queryResult.data)

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

    log.error({ error }, 'Error listing hatchlings')
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    )
  }
}

/**
 * POST /api/clutches/[id]/hatchlings - Create a new hatchling
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: clutchId } = await params
    const userId = await getUserId()

    if (!userId) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      )
    }

    const body = await request.json()

    const hatchling = await hatchlingService.create(userId, clutchId, body)

    return NextResponse.json({ data: hatchling }, { status: 201 })
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

    log.error({ error }, 'Error creating hatchling')
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    )
  }
}
