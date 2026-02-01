'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ArrowLeft, Edit, Trash2, Loader2, WifiOff } from 'lucide-react'
import { useReptile, useDeleteReptile } from '@/hooks'

interface ReptileHeaderProps {
  reptileId: string
}

export function ReptileHeader({ reptileId }: ReptileHeaderProps) {
  const router = useRouter()
  const { reptile, isPending, isOfflineData } = useReptile(reptileId)
  const deleteMutation = useDeleteReptile()
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(reptileId)
      router.push('/reptiles')
    } catch (error) {
      // Error is handled by the mutation
      console.error('Failed to delete reptile:', error)
    }
  }

  if (isPending) {
    return (
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-pulse">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 bg-warm-200 rounded" />
          <div>
            <div className="h-6 w-32 bg-warm-200 rounded mb-2" />
            <div className="h-4 w-24 bg-warm-200 rounded" />
          </div>
        </div>
      </div>
    )
  }

  if (!reptile) {
    return (
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild aria-label="Go back to reptiles list">
          <Link href="/reptiles">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-warm-900">Reptile not found</h1>
          <p className="text-warm-600">This reptile may have been deleted.</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild aria-label="Go back to reptiles list">
            <Link href="/reptiles">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-warm-900">{reptile.name}</h1>
              {isOfflineData && (
                <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <WifiOff className="h-3 w-3" />
                  Offline
                </span>
              )}
            </div>
            <p className="text-warm-600">
              {reptile.species}
              {reptile.morph && ` - ${reptile.morph}`}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/reptiles/${reptileId}/edit`}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Link>
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={() => setShowDeleteDialog(true)}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {reptile.name}?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. The reptile and all associated care
              records will be permanently deleted.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={deleteMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
