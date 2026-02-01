// API Route: /api/pairings/[id]/clutches - GET (list), POST (create)
import { NextRequest, NextResponse } from 'next/server'
import { getUserId } from '@/lib/supabase/server'
import { ClutchService } from '@/services/breeding.service'
import { ClutchQuerySchema } from '@/validations/breeding'
import { withErrorHandler } from '@/lib/api/error-handler'
import {
  successResponse,
  unauthorizedResponse,
  invalidQueryParamsResponse,
} from '@/lib/api/response'

const clutchService = new ClutchService()

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * GET /api/pairings/[id]/clutches - List all clutches for a pairing
 */
export const GET = withErrorHandler(
  async (request: NextRequest, { params }: RouteParams) => {
    const { id: pairingId } = await params
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
    const queryResult = ClutchQuerySchema.safeParse(rawParams)

    if (!queryResult.success) {
      const issues = queryResult.error.issues || []
      return invalidQueryParamsResponse(
        issues[0]?.message || 'Invalid query parameters',
        issues
      )
    }

    const result = await clutchService.list(userId, pairingId, queryResult.data)

    return NextResponse.json(result)
  },
  'ClutchAPI'
)

/**
 * POST /api/pairings/[id]/clutches - Create a new clutch
 */
export const POST = withErrorHandler(
  async (request: NextRequest, { params }: RouteParams) => {
    const { id: pairingId } = await params
    const userId = await getUserId()

    if (!userId) {
      return unauthorizedResponse()
    }

    const body = await request.json()
    const clutch = await clutchService.create(userId, pairingId, body)

    return successResponse(clutch, undefined, 201)
  },
  'ClutchAPI'
)
