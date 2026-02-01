// API Route: /api/reptiles/[id]/sheds - GET (list), POST (create)
import { NextRequest, NextResponse } from 'next/server'
import { getUserId } from '@/lib/supabase/server'
import { ShedService } from '@/services/shed.service'
import { ShedQuerySchema } from '@/validations/shed'
import { withErrorHandler } from '@/lib/api/error-handler'
import {
  successResponse,
  unauthorizedResponse,
  invalidQueryParamsResponse,
} from '@/lib/api/response'

const shedService = new ShedService()

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * GET /api/reptiles/[id]/sheds - List all sheds for a reptile
 */
export const GET = withErrorHandler(
  async (request: NextRequest, { params }: RouteParams) => {
    const { id: reptileId } = await params
    const userId = await getUserId()

    if (!userId) {
      return unauthorizedResponse()
    }

    // Parse query parameters - filter out null values so defaults apply
    const searchParams = request.nextUrl.searchParams
    const rawParams: Record<string, string> = {}
    for (const [key, value] of searchParams.entries()) {
      if (value) rawParams[key] = value
    }
    const queryResult = ShedQuerySchema.safeParse(rawParams)

    if (!queryResult.success) {
      const issues = queryResult.error.issues || []
      return invalidQueryParamsResponse(
        issues[0]?.message || 'Invalid query parameters',
        issues
      )
    }

    const result = await shedService.list(userId, reptileId, queryResult.data)

    return NextResponse.json(result)
  },
  'ShedAPI'
)

/**
 * POST /api/reptiles/[id]/sheds - Create a new shed record
 */
export const POST = withErrorHandler(
  async (request: NextRequest, { params }: RouteParams) => {
    const { id: reptileId } = await params
    const userId = await getUserId()

    if (!userId) {
      return unauthorizedResponse()
    }

    const body = await request.json()
    const shed = await shedService.create(userId, reptileId, body)

    return successResponse(shed, undefined, 201)
  },
  'ShedAPI'
)
