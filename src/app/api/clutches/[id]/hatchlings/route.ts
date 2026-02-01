// API Route: /api/clutches/[id]/hatchlings - GET (list), POST (create)
import { NextRequest, NextResponse } from 'next/server'
import { getUserId } from '@/lib/supabase/server'
import { HatchlingService } from '@/services/breeding.service'
import { HatchlingQuerySchema } from '@/validations/breeding'
import { withErrorHandler } from '@/lib/api/error-handler'
import {
  successResponse,
  unauthorizedResponse,
  invalidQueryParamsResponse,
} from '@/lib/api/response'

const hatchlingService = new HatchlingService()

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * GET /api/clutches/[id]/hatchlings - List all hatchlings for a clutch
 */
export const GET = withErrorHandler(
  async (request: NextRequest, { params }: RouteParams) => {
    const { id: clutchId } = await params
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
    const queryResult = HatchlingQuerySchema.safeParse(rawParams)

    if (!queryResult.success) {
      const issues = queryResult.error.issues || []
      return invalidQueryParamsResponse(
        issues[0]?.message || 'Invalid query parameters',
        issues
      )
    }

    const result = await hatchlingService.list(userId, clutchId, queryResult.data)

    return NextResponse.json(result)
  },
  'HatchlingAPI'
)

/**
 * POST /api/clutches/[id]/hatchlings - Create a new hatchling
 */
export const POST = withErrorHandler(
  async (request: NextRequest, { params }: RouteParams) => {
    const { id: clutchId } = await params
    const userId = await getUserId()

    if (!userId) {
      return unauthorizedResponse()
    }

    const body = await request.json()
    const hatchling = await hatchlingService.create(userId, clutchId, body)

    return successResponse(hatchling, undefined, 201)
  },
  'HatchlingAPI'
)
