'use client'

import { useState } from 'react'
import Image from 'next/image'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useDeletePhoto, useUpdatePhoto } from '@/hooks/use-photos'
import { Trash2, Loader2, Star, StarOff } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import type { Photo } from '@/generated/prisma/client'
import type { OfflinePhoto } from '@/lib/offline/db'

interface PhotoViewerProps {
  photo: Photo | OfflinePhoto | null
  open: boolean
  onClose: () => void
  getPhotoUrl: (photo: Photo | OfflinePhoto) => string
}

export function PhotoViewer({ photo, open, onClose, getPhotoUrl }: PhotoViewerProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const deleteMutation = useDeletePhoto()
  const updateMutation = useUpdatePhoto()

  if (!photo) return null

  const isPending = '_syncStatus' in photo && photo._syncStatus === 'pending'
  const isPrimary = 'isPrimary' in photo && photo.isPrimary
  // Get full-size URL by creating a copy without thumbnailPath
  const photoWithoutThumbnail = { ...photo, thumbnailPath: undefined }
  const fullUrl = getPhotoUrl(photoWithoutThumbnail as Photo | OfflinePhoto)
  const takenAt = 'takenAt' in photo
    ? photo.takenAt instanceof Date
      ? photo.takenAt
      : typeof photo.takenAt === 'number'
        ? new Date(photo.takenAt)
        : new Date(photo.takenAt)
    : new Date()

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(photo.id)
      setShowDeleteConfirm(false)
      onClose()
    } catch {
      // Error handled by mutation
    }
  }

  const handleTogglePrimary = async () => {
    try {
      await updateMutation.mutateAsync({
        photoId: photo.id,
        data: { isPrimary: !isPrimary },
      })
    } catch {
      // Error handled by mutation
    }
  }

  if (showDeleteConfirm) {
    return (
      <DeleteConfirmDialog
        open={open}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        isPending={deleteMutation.isPending}
      />
    )
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="sr-only">Photo Details</DialogTitle>
          <DialogDescription className="sr-only">
            View and manage this photo
          </DialogDescription>
        </DialogHeader>

        <div className="relative aspect-video bg-warm-100 rounded-lg overflow-hidden">
          <Image
            src={fullUrl}
            alt={photo.caption || 'Reptile photo'}
            fill
            className="object-contain"
            sizes="(max-width: 768px) 100vw, 672px"
            priority
          />
          {isPending && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <div className="text-white text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                <p className="text-sm">Waiting to sync</p>
              </div>
            </div>
          )}
        </div>

        <PhotoDetails
          caption={photo.caption}
          category={photo.category}
          takenAt={takenAt}
          isPrimary={isPrimary}
        />

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={handleTogglePrimary}
            disabled={updateMutation.isPending || isPending}
            className="w-full sm:w-auto"
          >
            {updateMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : isPrimary ? (
              <StarOff className="h-4 w-4 mr-2" />
            ) : (
              <Star className="h-4 w-4 mr-2" />
            )}
            {isPrimary ? 'Remove as Primary' : 'Set as Primary'}
          </Button>

          <Button
            variant="destructive"
            onClick={() => setShowDeleteConfirm(true)}
            disabled={deleteMutation.isPending || isPending}
            className="w-full sm:w-auto"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

interface PhotoDetailsProps {
  caption?: string | null
  category: string
  takenAt: Date
  isPrimary: boolean
}

function PhotoDetails({ caption, category, takenAt, isPrimary }: PhotoDetailsProps) {
  return (
    <div className="space-y-2">
      {caption && <p className="text-warm-700">{caption}</p>}

      <div className="flex flex-wrap gap-2 text-sm text-warm-700">
        <span className="inline-flex items-center px-2 py-1 bg-warm-100 rounded">
          {category.toLowerCase()}
        </span>
        <span>{formatDate(takenAt)}</span>
        {isPrimary && (
          <span className="inline-flex items-center px-2 py-1 bg-yellow-100 text-yellow-700 rounded">
            <Star className="h-3 w-3 mr-1 fill-current" />
            Primary
          </span>
        )}
      </div>
    </div>
  )
}

interface DeleteConfirmDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  isPending: boolean
}

function DeleteConfirmDialog({
  open,
  onClose,
  onConfirm,
  isPending,
}: DeleteConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Delete Photo</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this photo? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
