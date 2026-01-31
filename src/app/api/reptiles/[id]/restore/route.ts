// API Route: /api/reptiles/[id]/restore - POST (restore soft-deleted)
import { NextRequest, NextResponse } from 'next/server'
import { getUserId } from '@/lib/supabase/server'
import {
  ReptileService,
  NotFoundError,
  ForbiddenError,
  ValidationError,
} from '@/services/reptile.service'
import { createLogger } from '@/lib/logger'

const log = createLogger('ReptileAPI')
const reptileService = new ReptileService()

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * POST /api/reptiles/[id]/restore - Restore a soft-deleted reptile
 */
export async function POST(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const userId = await getUserId()

    if (!userId) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      )
    }

    const reptile = await reptileService.restore(userId, id)

    return NextResponse.json({ data: reptile })
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
      // Reptile is not deleted
      return NextResponse.json(
        { error: { code: 'NOT_DELETED', message: error.message } },
        { status: 400 }
      )
    }

    log.error({ error }, 'Error restoring reptile')
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    )
  }
}
