// API Route: /api/environment/[id] - GET, PUT, DELETE single environment log
import { NextRequest } from 'next/server'
import { getUserId } from '@/lib/supabase/server'
import { EnvironmentService } from '@/services/environment.service'
import { withErrorHandler } from '@/lib/api/error-handler'
import { successResponse, unauthorizedResponse } from '@/lib/api/response'

const environmentService = new EnvironmentService()

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * GET /api/environment/[id] - Get a single environment log by ID
 */
export const GET = withErrorHandler(
  async (_request: NextRequest, { params }: RouteParams) => {
    const { id } = await params
    const userId = await getUserId()

    if (!userId) {
      return unauthorizedResponse()
    }

    const envLog = await environmentService.getById(userId, id)

    return successResponse(envLog)
  },
  'EnvironmentAPI'
)

/**
 * PUT /api/environment/[id] - Update an environment log
 */
export const PUT = withErrorHandler(
  async (request: NextRequest, { params }: RouteParams) => {
    const { id } = await params
    const userId = await getUserId()

    if (!userId) {
      return unauthorizedResponse()
    }

    const body = await request.json()

    const envLog = await environmentService.update(userId, id, body)

    return successResponse(envLog)
  },
  'EnvironmentAPI'
)

/**
 * DELETE /api/environment/[id] - Delete an environment log
 */
export const DELETE = withErrorHandler(
  async (_request: NextRequest, { params }: RouteParams) => {
    const { id } = await params
    const userId = await getUserId()

    if (!userId) {
      return unauthorizedResponse()
    }

    const result = await environmentService.delete(userId, id)

    return successResponse(result)
  },
  'EnvironmentAPI'
)
