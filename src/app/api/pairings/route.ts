// API Route: /api/pairings - GET (list), POST (create)
import { NextRequest, NextResponse } from 'next/server'
import { getUserId } from '@/lib/supabase/server'
import {
  PairingService,
  NotFoundError,
  ForbiddenError,
  ValidationError,
} from '@/services/breeding.service'
import { PairingQuerySchema } from '@/validations/breeding'
import { createLogger } from '@/lib/logger'

const log = createLogger('PairingAPI')
const pairingService = new PairingService()

/**
 * GET /api/pairings - List all pairings for the user
 */
export async function GET(request: NextRequest) {
  try {
    const userId = await getUserId()

    if (!userId) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      )
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams
    const queryResult = PairingQuerySchema.safeParse({
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
      sort: searchParams.get('sort'),
      order: searchParams.get('order'),
      startDate: searchParams.get('startDate'),
      endDate: searchParams.get('endDate'),
      successful: searchParams.get('successful'),
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

    const result = await pairingService.list(userId, queryResult.data)

    return NextResponse.json(result)
  } catch (error) {
    log.error({ error }, 'Error listing pairings')
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    )
  }
}

/**
 * POST /api/pairings - Create a new pairing
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

    const pairing = await pairingService.create(userId, body)

    return NextResponse.json({ data: pairing }, { status: 201 })
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

    log.error({ error }, 'Error creating pairing')
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    )
  }
}
