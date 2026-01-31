// API Route: /api/feedings/[id] - GET, PUT, DELETE
import { NextRequest, NextResponse } from 'next/server'
import { getUserId } from '@/lib/supabase/server'
import {
  FeedingService,
  NotFoundError,
  ForbiddenError,
  ValidationError,
} from '@/services/feeding.service'
import { createLogger } from '@/lib/logger'

const log = createLogger('FeedingAPI')
const feedingService = new FeedingService()

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * GET /api/feedings/[id] - Get a single feeding by ID
 */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const userId = await getUserId()

    if (!userId) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      )
    }

    const feeding = await feedingService.getById(userId, id)

    return NextResponse.json({ data: feeding })
  } catch (error) {
    if (error instanceof NotFoundError) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: error.message } },
        { status: 404 }
      )
    }

    if (error instanceof ForbiddenError) {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: error.message } },
        { status: 403 }
      )
    }

    log.error({ error }, 'Error getting feeding')
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/feedings/[id] - Update a feeding
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const userId = await getUserId()

    if (!userId) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      )
    }

    const body = await request.json()

    const feeding = await feedingService.update(userId, id, body)

    return NextResponse.json({ data: feeding })
  } catch (error) {
    if (error instanceof NotFoundError) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: error.message } },
        { status: 404 }
      )
    }

    if (error instanceof ForbiddenError) {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: error.message } },
        { status: 403 }
      )
    }

    if (error instanceof ValidationError) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: error.message } },
        { status: 400 }
      )
    }

    log.error({ error }, 'Error updating feeding')
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/feedings/[id] - Delete a feeding
 */
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const userId = await getUserId()

    if (!userId) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      )
    }

    const result = await feedingService.delete(userId, id)

    return NextResponse.json({ data: result })
  } catch (error) {
    if (error instanceof NotFoundError) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: error.message } },
        { status: 404 }
      )
    }

    if (error instanceof ForbiddenError) {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: error.message } },
        { status: 403 }
      )
    }

    log.error({ error }, 'Error deleting feeding')
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    )
  }
}
