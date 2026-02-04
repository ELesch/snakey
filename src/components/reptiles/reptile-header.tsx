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
import { ArrowLeft, Edit, Trash2, Loader2 } from 'lucide-react'
import { useDeleteReptile } from '@/hooks'
import type { Reptile } from '@/generated/prisma/client'

interface ReptileHeaderProps {
  reptile: Reptile
  reptileId: string
}

export function ReptileHeader({ reptile, reptileId }: ReptileHeaderProps) {
  const router = useRouter()
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

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 min-w-0">
        <div className="flex items-center gap-4 min-w-0">
          <Button variant="ghost" size="icon" asChild aria-label="Go back to reptiles list" className="flex-shrink-0">
            <Link href="/reptiles">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div className="min-w-0">
            <h1 className="text-2xl font-bold text-warm-900 dark:text-warm-100 truncate">{reptile.name}</h1>
            <p className="text-warm-700 dark:text-warm-300">
              {reptile.species}
              {reptile.morph && ` - ${reptile.morph}`}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
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
