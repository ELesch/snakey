// API Route: /api/reptiles - GET (list), POST (create)
import { NextRequest, NextResponse } from 'next/server'
import { getUserId } from '@/lib/supabase/server'
import { ReptileService } from '@/services/reptile.service'
import { ReptileQuerySchema } from '@/validations/reptile'
import { withErrorHandler } from '@/lib/api/error-handler'
import {
  successResponse,
  unauthorizedResponse,
  invalidQueryParamsResponse,
} from '@/lib/api/response'

const reptileService = new ReptileService()

/**
 * GET /api/reptiles - List all reptiles for authenticated user
 */
export const GET = withErrorHandler(async (request: NextRequest) => {
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
  const queryResult = ReptileQuerySchema.safeParse(rawParams)

  if (!queryResult.success) {
    const issues = queryResult.error.issues || []
    return invalidQueryParamsResponse(
      issues[0]?.message || 'Invalid query parameters',
      issues
    )
  }

  const result = await reptileService.list(userId, queryResult.data)

  return NextResponse.json(result)
}, 'ReptileAPI')

/**
 * POST /api/reptiles - Create a new reptile
 */
export const POST = withErrorHandler(async (request: NextRequest) => {
  const userId = await getUserId()

  if (!userId) {
    return unauthorizedResponse()
  }

  const body = await request.json()
  const reptile = await reptileService.create(userId, body)

  return successResponse(reptile, undefined, 201)
}, 'ReptileAPI')
