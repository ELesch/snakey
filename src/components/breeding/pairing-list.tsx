'use client'

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { usePairings, useDeletePairing } from '@/hooks/use-breeding'
import { PairingForm } from './pairing-form'
import { PairingCard } from './pairing-card'
import { Plus, Heart } from 'lucide-react'
import type { Pairing, Reptile } from '@/generated/prisma/client'

type PairingWithRelations = Pairing & {
  male?: Reptile
  female?: Reptile
}

interface PairingListProps {
  onPairingSelect?: (pairing: Pairing) => void
}

export function PairingList({ onPairingSelect }: PairingListProps) {
  const [showForm, setShowForm] = useState(false)
  const [editingPairing, setEditingPairing] = useState<Pairing | null>(null)
  const [expandedPairingId, setExpandedPairingId] = useState<string | null>(null)

  const { pairings, isPending, isError, refetch } = usePairings()
  const deleteMutation = useDeletePairing()

  const handleDelete = useCallback(
    async (pairingId: string) => {
      if (confirm('Are you sure you want to delete this pairing?')) {
        await deleteMutation.mutateAsync(pairingId)
      }
    },
    [deleteMutation]
  )

  const toggleExpanded = useCallback((pairingId: string) => {
    setExpandedPairingId((prev) => (prev === pairingId ? null : pairingId))
  }, [])

  const handleEdit = useCallback((pairing: Pairing) => {
    setEditingPairing(pairing)
  }, [])

  const handleShowForm = useCallback(() => {
    setShowForm(true)
  }, [])

  const handleCloseDialog = useCallback(() => {
    setShowForm(false)
    setEditingPairing(null)
  }, [])

  if (isPending) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="py-6">
              <div className="h-4 bg-warm-200 dark:bg-warm-700 rounded w-1/3 mb-2" />
              <div className="h-3 bg-warm-100 dark:bg-warm-800 rounded w-1/2" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (isError) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-red-600">Failed to load pairings</p>
          <Button onClick={() => refetch()} className="mt-4">
            Retry
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Pairings</h3>
        <Button onClick={handleShowForm} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          New Pairing
        </Button>
      </div>

      <Dialog
        open={showForm || !!editingPairing}
        onOpenChange={(open) => {
          if (!open) {
            handleCloseDialog()
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingPairing ? 'Edit Pairing' : 'New Pairing'}
            </DialogTitle>
            <DialogDescription className="sr-only">
              {editingPairing
                ? 'Edit the details of this breeding pairing'
                : 'Create a new breeding pairing between two reptiles'}
            </DialogDescription>
          </DialogHeader>
          <PairingForm
            pairing={editingPairing ?? undefined}
            onSuccess={handleCloseDialog}
            onCancel={handleCloseDialog}
          />
        </DialogContent>
      </Dialog>

      {pairings.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Heart className="h-12 w-12 mx-auto mb-4 text-warm-300 dark:text-warm-600" />
            <p className="text-warm-700 dark:text-warm-300">No pairings yet</p>
            <p className="text-sm text-warm-700 dark:text-warm-300">
              Click &quot;New Pairing&quot; to record a breeding pair
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {(pairings as PairingWithRelations[]).map((pairing) => (
            <PairingCard
              key={pairing.id}
              pairing={pairing}
              isExpanded={expandedPairingId === pairing.id}
              onToggleExpand={() => toggleExpanded(pairing.id)}
              onEdit={() => handleEdit(pairing)}
              onDelete={() => handleDelete(pairing.id)}
              isDeletePending={deleteMutation.isPending}
            />
          ))}
        </div>
      )}
    </div>
  )
}
