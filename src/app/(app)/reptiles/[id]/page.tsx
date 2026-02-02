import { notFound, redirect } from 'next/navigation'
import { ReptileHeader } from '@/components/reptiles/reptile-header'
import { ReptileTabs } from '@/components/reptiles/reptile-tabs'
import { getUserId } from '@/lib/supabase/server'
import { ReptileService } from '@/services/reptile.service'
import { NotFoundError, ForbiddenError } from '@/lib/errors'

interface ReptileDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function ReptileDetailPage({ params }: ReptileDetailPageProps) {
  const { id } = await params

  const userId = await getUserId()
  if (!userId) {
    redirect('/login')
  }

  const reptileService = new ReptileService()
  let reptile

  try {
    reptile = await reptileService.getById(userId, id)
  } catch (error) {
    if (error instanceof NotFoundError || error instanceof ForbiddenError) {
      notFound()
    }
    throw error
  }

  return (
    <div className="space-y-6 overflow-x-hidden max-w-full min-w-0">
      <ReptileHeader reptile={reptile} reptileId={id} />
      <ReptileTabs reptileId={id} reptile={reptile} />
    </div>
  )
}
