import { notFound, redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EditReptileForm } from '@/components/reptiles/edit-reptile-form'
import { getUserId } from '@/lib/supabase/server'
import { ReptileService } from '@/services/reptile.service'
import { NotFoundError, ForbiddenError } from '@/lib/errors'

interface EditReptilePageProps {
  params: Promise<{ id: string }>
}

export default async function EditReptilePage({ params }: EditReptilePageProps) {
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
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Edit {reptile.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <EditReptileForm reptileId={id} reptile={reptile} />
        </CardContent>
      </Card>
    </div>
  )
}
