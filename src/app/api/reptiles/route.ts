// API Route: /api/reptiles - GET (list), POST (create)
import { NextRequest, NextResponse } from 'next/server'
import { getUserId } from '@/lib/supabase/server'
import {
  ReptileService,
  NotFoundError,
  ForbiddenError,
  ValidationError,
} from '@/services/reptile.service'
import { ReptileQuerySchema } from '@/validations/reptile'
import { createLogger } from '@/lib/logger'

const log = createLogger('ReptileAPI')
const reptileService = new ReptileService()

/**
 * GET /api/reptiles - List all reptiles for authenticated user
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

    // Parse query parameters - filter out null values so defaults apply
    const searchParams = request.nextUrl.searchParams
    const rawParams: Record<string, string> = {}
    for (const [key, value] of searchParams.entries()) {
      if (value) rawParams[key] = value
    }
    const queryResult = ReptileQuerySchema.safeParse(rawParams)

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

    const result = await reptileService.list(userId, queryResult.data)

    log.info({ userId, count: result.data.length, reptiles: result.data.map(r => r.name) }, 'Returning reptiles list')
    return NextResponse.json(result)
  } catch (error) {
    log.error({ error }, 'Error listing reptiles')
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    )
  }
}

/**
 * POST /api/reptiles - Create a new reptile
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

    const reptile = await reptileService.create(userId, body)

    return NextResponse.json({ data: reptile }, { status: 201 })
  } catch (error) {
    if (error instanceof ValidationError) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: error.message } },
        { status: 400 }
      )
    }

    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const errorStack = error instanceof Error ? error.stack : undefined
    log.error({ error, message: errorMessage, stack: errorStack }, 'Error creating reptile')
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: errorMessage, debug: errorStack } },
      { status: 500 }
    )
  }
}
