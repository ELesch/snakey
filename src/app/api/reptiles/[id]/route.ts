// API Route: /api/reptiles/[id] - GET, PUT, DELETE
import { NextRequest, NextResponse } from 'next/server'
import { getUserId } from '@/lib/supabase/server'
import { ReptileService } from '@/services/reptile.service'
import { ReptileIncludeSchema } from '@/validations/reptile'
import { withErrorHandler } from '@/lib/api/error-handler'
import {
  successResponse,
  unauthorizedResponse,
  invalidQueryParamsResponse,
} from '@/lib/api/response'

const reptileService = new ReptileService()

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * GET /api/reptiles/[id] - Get a single reptile by ID
 */
export const GET = withErrorHandler(
  async (request: NextRequest, { params }: RouteParams) => {
    const { id } = await params
    const userId = await getUserId()

    if (!userId) {
      return unauthorizedResponse()
    }

    // Parse include parameters - filter out null values so defaults apply
    const searchParams = request.nextUrl.searchParams
    const rawParams: Record<string, string> = {}
    for (const [key, value] of searchParams.entries()) {
      if (value) rawParams[key] = value
    }
    const includeResult = ReptileIncludeSchema.safeParse(rawParams)

    if (!includeResult.success) {
      const issues = includeResult.error.issues || []
      return invalidQueryParamsResponse(
        issues[0]?.message || 'Invalid query parameters',
        issues
      )
    }

    // Build include options for repository
    const includeOptions = includeResult.data.include
      ? buildIncludeOptions(includeResult.data)
      : undefined

    const shareId = searchParams.get('shareId') || undefined

    const reptile = await reptileService.getById(userId, id, {
      shareId,
      include: includeOptions,
    })

    return successResponse(reptile)
  },
  'ReptileAPI'
)

/**
 * PUT /api/reptiles/[id] - Update a reptile
 */
export const PUT = withErrorHandler(
  async (request: NextRequest, { params }: RouteParams) => {
    const { id } = await params
    const userId = await getUserId()

    if (!userId) {
      return unauthorizedResponse()
    }

    const body = await request.json()
    const reptile = await reptileService.update(userId, id, body)

    return successResponse(reptile)
  },
  'ReptileAPI'
)

/**
 * DELETE /api/reptiles/[id] - Soft delete a reptile
 */
export const DELETE = withErrorHandler(
  async (_request: NextRequest, { params }: RouteParams) => {
    const { id } = await params
    const userId = await getUserId()

    if (!userId) {
      return unauthorizedResponse()
    }

    const result = await reptileService.softDelete(userId, id)

    return successResponse(result)
  },
  'ReptileAPI'
)

/**
 * Helper to build Prisma include options from validated query params
 */
function buildIncludeOptions(params: {
  include?: string[]
  feedingsLimit: number
  shedsLimit: number
  weightsLimit: number
  photosLimit: number
}) {
  const { include = [], feedingsLimit, shedsLimit, weightsLimit, photosLimit } = params

  const includeOptions: Record<string, boolean | object> = {}

  if (include.includes('feedings')) {
    includeOptions.feedings = {
      take: feedingsLimit,
      orderBy: { date: 'desc' as const },
    }
  }

  if (include.includes('sheds')) {
    includeOptions.sheds = {
      take: shedsLimit,
      orderBy: { completedDate: 'desc' as const },
    }
  }

  if (include.includes('weights')) {
    includeOptions.weights = {
      take: weightsLimit,
      orderBy: { date: 'desc' as const },
    }
  }

  if (include.includes('photos')) {
    includeOptions.photos = {
      take: photosLimit,
      orderBy: { takenAt: 'desc' as const },
    }
  }

  if (include.includes('vetVisits')) {
    includeOptions.vetVisits = {
      take: 10,
      orderBy: { date: 'desc' as const },
    }
  }

  if (include.includes('medications')) {
    includeOptions.medications = true
  }

  // Note: 'stats' would require additional computation, not direct include
  // This would be handled separately in the service layer

  return Object.keys(includeOptions).length > 0 ? includeOptions : undefined
}
