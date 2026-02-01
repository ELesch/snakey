// API Route: /api/pairings - GET (list), POST (create)
import { NextRequest, NextResponse } from 'next/server'
import { getUserId } from '@/lib/supabase/server'
import { PairingService } from '@/services/breeding.service'
import { PairingQuerySchema } from '@/validations/breeding'
import { withErrorHandler } from '@/lib/api/error-handler'
import {
  successResponse,
  unauthorizedResponse,
  invalidQueryParamsResponse,
} from '@/lib/api/response'

const pairingService = new PairingService()

/**
 * GET /api/pairings - List all pairings for the user
 */
export const GET = withErrorHandler(
  async (request: NextRequest) => {
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
    const queryResult = PairingQuerySchema.safeParse(rawParams)

    if (!queryResult.success) {
      const issues = queryResult.error.issues || []
      return invalidQueryParamsResponse(
        issues[0]?.message || 'Invalid query parameters',
        issues
      )
    }

    const result = await pairingService.list(userId, queryResult.data)

    return NextResponse.json(result)
  },
  'PairingAPI'
)

/**
 * POST /api/pairings - Create a new pairing
 */
export const POST = withErrorHandler(
  async (request: NextRequest) => {
    const userId = await getUserId()

    if (!userId) {
      return unauthorizedResponse()
    }

    const body = await request.json()
    const pairing = await pairingService.create(userId, body)

    return successResponse(pairing, undefined, 201)
  },
  'PairingAPI'
)
