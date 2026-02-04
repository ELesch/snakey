'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useFeedings, useDeleteFeeding } from '@/hooks/use-feedings'
import { FeedingForm } from '@/components/forms'
import { FeedingCard } from './feeding-card'
import { Plus, UtensilsCrossed, Loader2, WifiOff, AlertCircle } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import type { Feeding } from '@/generated/prisma/client'
import type { OfflineFeeding } from '@/lib/offline/db'

interface FeedingHistoryProps {
  reptileId: string
}

export function FeedingHistory({ reptileId }: FeedingHistoryProps) {
  const [showForm, setShowForm] = useState(false)
  const [editingFeeding, setEditingFeeding] = useState<Feeding | OfflineFeeding | null>(null)
  const { feedings, isPending, isError, error, isOfflineData } = useFeedings(reptileId)
  const deleteFeeding = useDeleteFeeding(reptileId)

  const handleEdit = (feeding: Feeding | OfflineFeeding) => {
    setEditingFeeding(feeding)
    setShowForm(true)
  }

  const handleDelete = (feedingId: string) => {
    if (confirm('Are you sure you want to delete this feeding record?')) {
      deleteFeeding.mutate(feedingId)
    }
  }

  const handleFormClose = () => {
    setShowForm(false)
    setEditingFeeding(null)
  }

  if (isPending) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Feeding History</h3>
          <Button size="sm" disabled>
            <Plus className="h-4 w-4 mr-2" aria-hidden="true" />Log Feeding
          </Button>
        </div>
        <Card>
          <CardContent className="py-12 text-center">
            <Loader2 className="h-8 w-8 mx-auto mb-4 text-warm-400 animate-spin" aria-hidden="true" />
            <p className="text-warm-700 dark:text-warm-300">Loading feeding history...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Feeding History</h3>
          <Button onClick={() => setShowForm(true)} size="sm">
            <Plus className="h-4 w-4 mr-2" aria-hidden="true" />Log Feeding
          </Button>
        </div>
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-400" aria-hidden="true" />
            <p className="text-red-600">Failed to load feeding history</p>
            <p className="text-sm text-warm-700 dark:text-warm-300">{error?.message || 'Please try again later'}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold">Feeding History</h3>
          {isOfflineData && (
            <WifiOff className="h-4 w-4 text-warm-400" aria-label="Showing offline data" />
          )}
        </div>
        <Button onClick={() => setShowForm(true)} size="sm">
          <Plus className="h-4 w-4 mr-2" aria-hidden="true" />Log Feeding
        </Button>
      </div>

      <Dialog open={showForm} onOpenChange={handleFormClose}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingFeeding ? 'Edit Feeding' : 'Log Feeding'}</DialogTitle>
            <DialogDescription>
              {editingFeeding ? 'Update the feeding record.' : 'Record a new feeding event.'}
            </DialogDescription>
          </DialogHeader>
          <FeedingForm
            reptileId={reptileId}
            feeding={editingFeeding}
            onSuccess={handleFormClose}
            onCancel={handleFormClose}
          />
        </DialogContent>
      </Dialog>

      {feedings.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <UtensilsCrossed className="h-12 w-12 mx-auto mb-4 text-warm-300 dark:text-warm-600" aria-hidden="true" />
            <p className="text-warm-700 dark:text-warm-300">No feeding records yet</p>
            <p className="text-sm text-warm-700 dark:text-warm-300">Click &quot;Log Feeding&quot; to add one</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {feedings.map((feeding) => (
            <FeedingCard
              key={feeding.id}
              feeding={feeding}
              onEdit={() => handleEdit(feeding)}
              onDelete={() => handleDelete(feeding.id)}
              isDeleting={deleteFeeding.isPending}
            />
          ))}
        </div>
      )}
    </div>
  )
}
