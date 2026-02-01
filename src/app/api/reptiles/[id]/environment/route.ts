// API Route: /api/reptiles/[id]/environment - GET list, POST create
import { NextRequest, NextResponse } from 'next/server'
import { getUserId } from '@/lib/supabase/server'
import { EnvironmentService } from '@/services/environment.service'
import { EnvironmentQuerySchema } from '@/validations/environment'
import { withErrorHandler } from '@/lib/api/error-handler'
import {
  successResponse,
  unauthorizedResponse,
  invalidQueryParamsResponse,
} from '@/lib/api/response'

const environmentService = new EnvironmentService()

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * GET /api/reptiles/[id]/environment - List environment logs for a reptile
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
    const queryResult = EnvironmentQuerySchema.safeParse(rawParams)

    if (!queryResult.success) {
      const issues = queryResult.error.issues || []
      return invalidQueryParamsResponse(
        issues[0]?.message || 'Invalid query parameters',
        issues
      )
    }

    const result = await environmentService.list(userId, reptileId, queryResult.data)

    return NextResponse.json(result)
  },
  'EnvironmentAPI'
)

/**
 * POST /api/reptiles/[id]/environment - Create a new environment log
 */
export const POST = withErrorHandler(
  async (request: NextRequest, { params }: RouteParams) => {
    const { id: reptileId } = await params
    const userId = await getUserId()

    if (!userId) {
      return unauthorizedResponse()
    }

    const body = await request.json()
    const envLog = await environmentService.create(userId, reptileId, body)

    return successResponse(envLog, undefined, 201)
  },
  'EnvironmentAPI'
)
