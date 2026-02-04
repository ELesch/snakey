'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useSheds, useDeleteShed } from '@/hooks/use-sheds'
import { ShedForm } from '@/components/forms'
import { ShedCard } from './shed-card'
import { Plus, Layers, Loader2, AlertCircle, WifiOff } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import type { Shed } from '@/generated/prisma/client'
import type { OfflineShed } from '@/lib/offline/db'

interface ShedHistoryProps {
  reptileId: string
}

export function ShedHistory({ reptileId }: ShedHistoryProps) {
  const [showForm, setShowForm] = useState(false)
  const [editingShed, setEditingShed] = useState<Shed | OfflineShed | null>(null)
  const { sheds, isPending, isError, error, isOfflineData } = useSheds(reptileId)
  const deleteShed = useDeleteShed(reptileId)

  const handleEdit = (shed: Shed | OfflineShed) => {
    setEditingShed(shed)
    setShowForm(true)
  }

  const handleDelete = (shedId: string) => {
    if (confirm('Are you sure you want to delete this shed record?')) {
      deleteShed.mutate(shedId)
    }
  }

  const handleFormClose = () => {
    setShowForm(false)
    setEditingShed(null)
  }

  if (isPending) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-warm-400" aria-hidden="true" />
        <span className="sr-only">Loading shed history</span>
      </div>
    )
  }

  if (isError) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-400" aria-hidden="true" />
          <p className="text-warm-700">Failed to load shed history</p>
          <p className="text-sm text-warm-700">{error?.message}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold">Shed History</h3>
          {isOfflineData && (
            <WifiOff className="h-4 w-4 text-warm-400" aria-label="Showing offline data" />
          )}
        </div>
        <Button onClick={() => setShowForm(true)} size="sm">
          <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
          Log Shed
        </Button>
      </div>

      <Dialog open={showForm} onOpenChange={handleFormClose}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingShed ? 'Edit Shed' : 'Log Shed'}</DialogTitle>
            <DialogDescription>
              {editingShed ? 'Update the shed record.' : 'Record a new shedding event.'}
            </DialogDescription>
          </DialogHeader>
          <ShedForm
            reptileId={reptileId}
            shed={editingShed}
            onSuccess={handleFormClose}
            onCancel={handleFormClose}
          />
        </DialogContent>
      </Dialog>

      {sheds.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Layers className="h-12 w-12 mx-auto mb-4 text-warm-300" aria-hidden="true" />
            <p className="text-warm-700">No shed records yet</p>
            <p className="text-sm text-warm-700">Click &quot;Log Shed&quot; to add one</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {sheds.map((shed) => (
            <ShedCard
              key={shed.id}
              shed={shed}
              onEdit={() => handleEdit(shed)}
              onDelete={() => handleDelete(shed.id)}
              isDeleting={deleteShed.isPending}
            />
          ))}
        </div>
      )}
    </div>
  )
}
