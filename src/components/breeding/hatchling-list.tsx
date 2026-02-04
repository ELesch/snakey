'use client'

import { useState, useCallback, memo } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { formatDate } from '@/lib/utils'
import { useHatchlings, useDeleteHatchling } from '@/hooks/use-breeding'
import { HatchlingForm } from './hatchling-form'
import { Plus, Baby, Trash2, Edit } from 'lucide-react'
import type { Hatchling } from '@/generated/prisma/client'

interface HatchlingListProps {
  clutchId: string
}

const statusColors: Record<string, string> = {
  DEVELOPING: 'bg-blue-100 text-blue-900',
  HATCHED: 'bg-green-100 text-green-900',
  FAILED: 'bg-red-100 text-red-900',
  SOLD: 'bg-purple-100 text-purple-900',
  KEPT: 'bg-amber-100 text-amber-900',
}

const statusLabels: Record<string, string> = {
  DEVELOPING: 'Developing',
  HATCHED: 'Hatched',
  FAILED: 'Failed',
  SOLD: 'Sold',
  KEPT: 'Kept',
}

interface HatchlingItemProps {
  hatchling: Hatchling
  index: number
  onEdit: () => void
  onDelete: () => void
  isDeletePending: boolean
}

const HatchlingItem = memo(function HatchlingItem({
  hatchling,
  index,
  onEdit,
  onDelete,
  isDeletePending,
}: HatchlingItemProps) {
  return (
    <div className="flex items-center justify-between bg-[var(--color-card)] rounded p-2 border border-[var(--color-border)]">
      <div className="flex items-center gap-2">
        <Baby className="h-3 w-3 text-warm-400" />
        <div>
          <p className="text-xs font-medium">
            #{index + 1}
            {hatchling.morph && ` - ${hatchling.morph}`}
          </p>
          <div className="flex items-center gap-2 text-xs text-warm-700 dark:text-warm-300">
            <span
              className={`px-1.5 py-0.5 rounded text-xs ${statusColors[hatchling.status]}`}
            >
              {statusLabels[hatchling.status]}
            </span>
            {hatchling.sex !== 'UNKNOWN' && (
              <span>{hatchling.sex === 'MALE' ? 'Male' : 'Female'}</span>
            )}
            {hatchling.hatchDate && (
              <span>{formatDate(hatchling.hatchDate)}</span>
            )}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={onEdit}
          className="h-6 w-6 p-0"
          aria-label={`Edit hatchling ${index + 1}${hatchling.morph ? ` - ${hatchling.morph}` : ''}`}
        >
          <Edit className="h-3 w-3" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onDelete}
          disabled={isDeletePending}
          className="h-6 w-6 p-0"
          aria-label={`Delete hatchling ${index + 1}${hatchling.morph ? ` - ${hatchling.morph}` : ''}`}
        >
          <Trash2 className="h-3 w-3 text-red-500" />
        </Button>
      </div>
    </div>
  )
})

export function HatchlingList({ clutchId }: HatchlingListProps) {
  const [showForm, setShowForm] = useState(false)
  const [editingHatchling, setEditingHatchling] = useState<Hatchling | null>(null)

  const { hatchlings, isPending, isError, refetch } = useHatchlings(clutchId)
  const deleteMutation = useDeleteHatchling(clutchId)

  const handleDelete = useCallback(
    async (hatchlingId: string) => {
      if (confirm('Are you sure you want to delete this hatchling?')) {
        await deleteMutation.mutateAsync(hatchlingId)
      }
    },
    [deleteMutation]
  )

  const handleShowForm = useCallback(() => {
    setShowForm(true)
  }, [])

  const handleEditHatchling = useCallback((hatchling: Hatchling) => {
    setEditingHatchling(hatchling)
  }, [])

  const handleCloseDialog = useCallback(() => {
    setShowForm(false)
    setEditingHatchling(null)
  }, [])

  if (isPending) {
    return (
      <div className="space-y-2">
        {[1, 2].map((i) => (
          <div key={i} className="animate-pulse bg-warm-100 dark:bg-warm-800 rounded p-2">
            <div className="h-2 bg-warm-200 dark:bg-warm-700 rounded w-1/4" />
          </div>
        ))}
      </div>
    )
  }

  if (isError) {
    return (
      <div className="text-center py-2">
        <p className="text-red-600 text-xs">Failed to load hatchlings</p>
        <Button onClick={() => refetch()} size="sm" className="mt-1 h-6 text-xs">
          Retry
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <h5 className="text-xs font-medium text-warm-800 dark:text-warm-200">Hatchlings</h5>
        <Button onClick={handleShowForm} size="sm" variant="ghost" className="h-6 text-xs">
          <Plus className="h-3 w-3 mr-1" />
          Add
        </Button>
      </div>

      <Dialog
        open={showForm || !!editingHatchling}
        onOpenChange={(open) => {
          if (!open) {
            handleCloseDialog()
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingHatchling ? 'Edit Hatchling' : 'New Hatchling'}
            </DialogTitle>
            <DialogDescription className="sr-only">
              {editingHatchling
                ? 'Edit the details of this hatchling'
                : 'Add a new hatchling to this clutch'}
            </DialogDescription>
          </DialogHeader>
          <HatchlingForm
            clutchId={clutchId}
            hatchling={editingHatchling ?? undefined}
            onSuccess={handleCloseDialog}
            onCancel={handleCloseDialog}
          />
        </DialogContent>
      </Dialog>

      {hatchlings.length === 0 ? (
        <div className="text-center py-4 bg-warm-100/50 dark:bg-warm-800/50 rounded">
          <Baby className="h-6 w-6 mx-auto mb-1 text-warm-300 dark:text-warm-600" />
          <p className="text-xs text-warm-700 dark:text-warm-300">No hatchlings recorded</p>
        </div>
      ) : (
        <div className="space-y-1">
          {hatchlings.map((hatchling, index) => (
            <HatchlingItem
              key={hatchling.id}
              hatchling={hatchling}
              index={index}
              onEdit={() => handleEditHatchling(hatchling)}
              onDelete={() => handleDelete(hatchling.id)}
              isDeletePending={deleteMutation.isPending}
            />
          ))}
        </div>
      )}
    </div>
  )
}
