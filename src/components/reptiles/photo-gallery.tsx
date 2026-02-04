'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { usePhotos } from '@/hooks/use-photos'
import { PhotoUpload } from './photo-upload'
import { PhotoViewer } from './photo-viewer'
import { Camera, ImageIcon, Loader2, WifiOff } from 'lucide-react'
import type { Photo } from '@/generated/prisma/client'
import type { OfflinePhoto } from '@/lib/offline/db'

interface PhotoGalleryProps {
  reptileId: string
}

export function PhotoGallery({ reptileId }: PhotoGalleryProps) {
  const [showUpload, setShowUpload] = useState(false)
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | OfflinePhoto | null>(null)

  const { photos, isPending, isError, error, isOfflineData, refetch } = usePhotos(reptileId)

  const getPhotoUrl = (photo: Photo | OfflinePhoto): string => {
    // For offline photos with blobs, create object URL
    if ('blob' in photo && photo.blob) {
      return URL.createObjectURL(photo.blob)
    }
    // For synced photos, use Supabase storage URL
    const storagePath = photo.thumbnailPath || photo.storagePath
    return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/photos/${storagePath}`
  }

  if (isPending) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-warm-400" aria-hidden="true" />
        <span className="sr-only">Loading...</span>
      </div>
    )
  }

  if (isError) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-red-600">Error loading photos: {error?.message}</p>
          <Button onClick={() => refetch()} variant="outline" className="mt-4">
            Try Again
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold">Photos</h3>
          {isOfflineData && (
            <span className="flex items-center gap-1 text-xs text-warm-700 dark:text-warm-300">
              <WifiOff className="h-3 w-3" />
              Offline
            </span>
          )}
        </div>
        <Button onClick={() => setShowUpload(true)} size="sm">
          <Camera className="h-4 w-4 mr-2" />
          Add Photo
        </Button>
      </div>

      {photos.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <ImageIcon className="h-12 w-12 mx-auto mb-4 text-warm-300 dark:text-warm-600" />
            <p className="text-warm-700 dark:text-warm-300">No photos yet</p>
            <p className="text-sm text-warm-700 dark:text-warm-300">
              Click &quot;Add Photo&quot; to upload one
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {photos.map((photo) => (
            <PhotoThumbnail
              key={photo.id}
              photo={photo}
              photoUrl={getPhotoUrl(photo)}
              onClick={() => setSelectedPhoto(photo)}
            />
          ))}
        </div>
      )}

      <PhotoUpload
        reptileId={reptileId}
        open={showUpload}
        onClose={() => setShowUpload(false)}
      />

      <PhotoViewer
        photo={selectedPhoto}
        open={!!selectedPhoto}
        onClose={() => setSelectedPhoto(null)}
        getPhotoUrl={getPhotoUrl}
      />
    </div>
  )
}

interface PhotoThumbnailProps {
  photo: Photo | OfflinePhoto
  photoUrl: string
  onClick: () => void
}

function PhotoThumbnail({ photo, photoUrl, onClick }: PhotoThumbnailProps) {
  const isPending = '_syncStatus' in photo && photo._syncStatus === 'pending'

  return (
    <button
      onClick={onClick}
      className="relative aspect-square rounded-lg overflow-hidden bg-warm-100 dark:bg-warm-800 hover:ring-2 hover:ring-primary focus:outline-none focus:ring-2 focus:ring-primary transition-all"
      aria-label={photo.caption || 'View photo'}
    >
      <Image
        src={photoUrl}
        alt={photo.caption || 'Reptile photo'}
        fill
        className="object-cover"
        sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
      />
      {isPending && (
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-white" />
        </div>
      )}
      {photo.category !== 'GENERAL' && (
        <span className="absolute bottom-1 left-1 text-xs bg-black/60 text-white px-1.5 py-0.5 rounded">
          {photo.category.toLowerCase()}
        </span>
      )}
    </button>
  )
}
