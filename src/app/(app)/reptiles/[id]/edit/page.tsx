import { notFound, redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EditReptileForm } from '@/components/reptiles/edit-reptile-form'
import { getUserId } from '@/lib/supabase/server'
import { ReptileService } from '@/services/reptile.service'
import { NotFoundError, ForbiddenError } from '@/lib/errors'
import type { Reptile, Photo } from '@/generated/prisma/client'

/** Reptile with photos relation included */
type ReptileWithPhotos = Reptile & {
  photos: Photo[]
}

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
    reptile = await reptileService.getById(userId, id, {
      include: { photos: true }
    })
  } catch (error) {
    if (error instanceof NotFoundError || error instanceof ForbiddenError) {
      notFound()
    }
    throw error
  }

  // Extract primary photo URL for display in the form
  // Prefer imageData (stored in database), fall back to Supabase storage URL
  const reptileWithPhotos = reptile as ReptileWithPhotos
  const primaryPhoto = reptileWithPhotos.photos?.find((p) => p.isPrimary)
  let profilePhotoUrl: string | undefined
  if (primaryPhoto) {
    if (primaryPhoto.imageData) {
      profilePhotoUrl = primaryPhoto.imageData
    } else if (primaryPhoto.storagePath) {
      profilePhotoUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/photos/${primaryPhoto.thumbnailPath || primaryPhoto.storagePath}`
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Edit {reptile.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <EditReptileForm
            reptileId={id}
            reptile={reptile}
            existingProfilePhotoUrl={profilePhotoUrl}
          />
        </CardContent>
      </Card>
    </div>
  )
}
