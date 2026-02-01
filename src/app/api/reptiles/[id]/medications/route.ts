// API Route: /api/reptiles/[id]/medications - GET (list), POST (create)
import { NextRequest, NextResponse } from 'next/server'
import { getUserId } from '@/lib/supabase/server'
import { VetService } from '@/services/vet.service'
import { MedicationQuerySchema } from '@/validations/vet'
import { withErrorHandler } from '@/lib/api/error-handler'
import {
  successResponse,
  unauthorizedResponse,
  invalidQueryParamsResponse,
} from '@/lib/api/response'

const vetService = new VetService()

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * GET /api/reptiles/[id]/medications - List all medications for a reptile
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
    const queryResult = MedicationQuerySchema.safeParse(rawParams)

    if (!queryResult.success) {
      const issues = queryResult.error.issues || []
      return invalidQueryParamsResponse(
        issues[0]?.message || 'Invalid query parameters',
        issues
      )
    }

    const result = await vetService.listMedications(userId, reptileId, queryResult.data)

    return NextResponse.json(result)
  },
  'MedicationAPI'
)

/**
 * POST /api/reptiles/[id]/medications - Create a new medication
 */
export const POST = withErrorHandler(
  async (request: NextRequest, { params }: RouteParams) => {
    const { id: reptileId } = await params
    const userId = await getUserId()

    if (!userId) {
      return unauthorizedResponse()
    }

    const body = await request.json()
    const medication = await vetService.createMedication(userId, reptileId, body)

    return successResponse(medication, undefined, 201)
  },
  'MedicationAPI'
)
