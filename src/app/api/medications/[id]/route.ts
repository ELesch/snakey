// API Route: /api/medications/[id] - GET, PUT, DELETE
import { NextRequest } from 'next/server'
import { getUserId } from '@/lib/supabase/server'
import { VetService } from '@/services/vet.service'
import { withErrorHandler } from '@/lib/api/error-handler'
import { successResponse, unauthorizedResponse } from '@/lib/api/response'

const vetService = new VetService()

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * GET /api/medications/[id] - Get a single medication by ID
 */
export const GET = withErrorHandler(
  async (_request: NextRequest, { params }: RouteParams) => {
    const { id } = await params
    const userId = await getUserId()

    if (!userId) {
      return unauthorizedResponse()
    }

    const medication = await vetService.getMedicationById(userId, id)

    return successResponse(medication)
  },
  'MedicationAPI'
)

/**
 * PUT /api/medications/[id] - Update a medication
 */
export const PUT = withErrorHandler(
  async (request: NextRequest, { params }: RouteParams) => {
    const { id } = await params
    const userId = await getUserId()

    if (!userId) {
      return unauthorizedResponse()
    }

    const body = await request.json()

    const medication = await vetService.updateMedication(userId, id, body)

    return successResponse(medication)
  },
  'MedicationAPI'
)

/**
 * DELETE /api/medications/[id] - Delete a medication
 */
export const DELETE = withErrorHandler(
  async (_request: NextRequest, { params }: RouteParams) => {
    const { id } = await params
    const userId = await getUserId()

    if (!userId) {
      return unauthorizedResponse()
    }

    const result = await vetService.deleteMedication(userId, id)

    return successResponse(result)
  },
  'MedicationAPI'
)
