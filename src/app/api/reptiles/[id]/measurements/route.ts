// API Route: /api/reptiles/[id]/measurements - GET (list), POST (create)
import { NextRequest, NextResponse } from 'next/server'
import { getUserId } from '@/lib/supabase/server'
import { MeasurementService } from '@/services/measurement.service'
import { MeasurementQuerySchema } from '@/validations/measurement'
import { withErrorHandler } from '@/lib/api/error-handler'
import {
  successResponse,
  unauthorizedResponse,
  invalidQueryParamsResponse,
} from '@/lib/api/response'

const measurementService = new MeasurementService()

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * GET /api/reptiles/[id]/measurements - List all measurements for a reptile
 *
 * Query params:
 * - type: Optional MeasurementType to filter by (WEIGHT, LENGTH, SHELL_LENGTH, etc.)
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 20, max: 100)
 * - sort: Sort field (date, value, type, createdAt)
 * - order: Sort order (asc, desc)
 * - startDate: Filter measurements on or after this date
 * - endDate: Filter measurements on or before this date
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
    const queryResult = MeasurementQuerySchema.safeParse(rawParams)

    if (!queryResult.success) {
      const issues = queryResult.error.issues || []
      return invalidQueryParamsResponse(
        issues[0]?.message || 'Invalid query parameters',
        issues
      )
    }

    const result = await measurementService.list(userId, reptileId, queryResult.data)

    return NextResponse.json(result)
  },
  'MeasurementAPI'
)

/**
 * POST /api/reptiles/[id]/measurements - Create a new measurement record
 *
 * Request body:
 * - type: MeasurementType (WEIGHT, LENGTH, SHELL_LENGTH, SHELL_WIDTH, SNOUT_TO_VENT, TAIL_LENGTH)
 * - value: number (positive)
 * - unit: string (e.g., "g", "cm", "in")
 * - date: ISO date string
 * - notes: Optional string (max 2000 chars)
 */
export const POST = withErrorHandler(
  async (request: NextRequest, { params }: RouteParams) => {
    const { id: reptileId } = await params
    const userId = await getUserId()

    if (!userId) {
      return unauthorizedResponse()
    }

    const body = await request.json()
    const measurement = await measurementService.create(userId, reptileId, body)

    return successResponse(measurement, undefined, 201)
  },
  'MeasurementAPI'
)
