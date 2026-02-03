'use client'

import { memo, useCallback, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { ReptileIcon } from '@/components/icons/reptile-icon'
import { ReptileForm } from './reptile-form'
import type { Reptile } from '@/generated/prisma/client'
import type { ReptileWithProfilePhoto } from '@/types/reptile'

interface ReptileCardProps {
  reptile: ReptileWithProfilePhoto
}

/**
 * Get the photo URL - prefer imageData (base64), fall back to Supabase storage
 */
function getPhotoSrc(photo: { storagePath: string | null; thumbnailPath: string | null; imageData: string | null }): string | null {
  // Prefer imageData (stored in database)
  if (photo.imageData) {
    return photo.imageData
  }
  // Fall back to Supabase storage URL
  if (photo.storagePath) {
    const path = photo.thumbnailPath || photo.storagePath
    return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/photos/${path}`
  }
  return null
}

const ReptileCard = memo(function ReptileCard({ reptile }: ReptileCardProps) {
  const [imageError, setImageError] = useState(false)
  const photo = reptile.photos && reptile.photos.length > 0 ? reptile.photos[0] : null
  const photoSrc = photo ? getPhotoSrc(photo) : null
  const hasPhoto = photoSrc && !imageError

  return (
    <Link href={`/reptiles/${reptile.id}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
        <CardContent className="p-0">
          <div className="aspect-square bg-[var(--color-muted)] rounded-t-lg overflow-hidden relative">
            {hasPhoto ? (
              <Image
                src={photoSrc}
                alt={reptile.name}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <ReptileIcon variant="snake" className="h-16 w-16 text-[var(--color-muted-foreground)]" aria-hidden="true" />
              </div>
            )}
          </div>
          <div className="p-4">
            <h3 className="font-semibold text-[var(--color-card-foreground)]">{reptile.name}</h3>
            <p className="text-sm text-[var(--color-muted-foreground)]">{reptile.species}</p>
            {reptile.morph && (
              <p className="text-xs text-[var(--color-muted-foreground)]">{reptile.morph}</p>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  )
})

interface ReptileGridProps {
  reptiles: ReptileWithProfilePhoto[]
}

export function ReptileGrid({ reptiles }: ReptileGridProps) {
  const router = useRouter()

  const handleSuccess = useCallback(
    (reptile: Reptile) => {
      router.push(`/reptiles/${reptile.id}`)
    },
    [router]
  )

  if (reptiles.length === 0) {
    return (
      <div className="max-w-md mx-auto py-8">
        <div className="text-center mb-6">
          <ReptileIcon variant="snake" className="h-16 w-16 mx-auto mb-4 text-primary-600" aria-hidden="true" />
          <h2 className="text-xl font-semibold text-foreground mb-2">Add Your First Reptile</h2>
          <p className="text-muted-foreground">
            Get started by adding your first reptile to begin tracking their care.
          </p>
        </div>
        <Card>
          <CardContent className="pt-6">
            <ReptileForm onSuccess={handleSuccess} />
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {reptiles.map((reptile) => (
        <ReptileCard key={reptile.id} reptile={reptile} />
      ))}
    </div>
  )
}
