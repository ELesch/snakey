'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { formatDate } from '@/lib/utils'
import { usePairings, useDeletePairing } from '@/hooks/use-breeding'
import { PairingForm } from './pairing-form'
import { ClutchList } from './clutch-list'
import { Plus, Heart, Check, X, ChevronDown, ChevronUp, Trash2, Edit } from 'lucide-react'
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

  const handleDelete = async (pairingId: string) => {
    if (confirm('Are you sure you want to delete this pairing?')) {
      await deleteMutation.mutateAsync(pairingId)
    }
  }

  const toggleExpanded = (pairingId: string) => {
    setExpandedPairingId((prev) => (prev === pairingId ? null : pairingId))
  }

  if (isPending) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="py-6">
              <div className="h-4 bg-warm-200 rounded w-1/3 mb-2" />
              <div className="h-3 bg-warm-100 rounded w-1/2" />
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
        <Button onClick={() => setShowForm(true)} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          New Pairing
        </Button>
      </div>

      <Dialog
        open={showForm || !!editingPairing}
        onOpenChange={(open) => {
          if (!open) {
            setShowForm(false)
            setEditingPairing(null)
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingPairing ? 'Edit Pairing' : 'New Pairing'}
            </DialogTitle>
          </DialogHeader>
          <PairingForm
            pairing={editingPairing ?? undefined}
            onSuccess={() => {
              setShowForm(false)
              setEditingPairing(null)
            }}
            onCancel={() => {
              setShowForm(false)
              setEditingPairing(null)
            }}
          />
        </DialogContent>
      </Dialog>

      {pairings.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Heart className="h-12 w-12 mx-auto mb-4 text-warm-300" />
            <p className="text-warm-600">No pairings yet</p>
            <p className="text-sm text-warm-500">
              Click &quot;New Pairing&quot; to record a breeding pair
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {(pairings as PairingWithRelations[]).map((pairing) => (
            <Card key={pairing.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Heart className="h-4 w-4 text-primary-500" />
                    {pairing.male?.name ?? 'Male'} x {pairing.female?.name ?? 'Female'}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    {pairing.successful !== null && (
                      <span
                        className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full ${
                          pairing.successful
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {pairing.successful ? (
                          <Check className="h-3 w-3" />
                        ) : (
                          <X className="h-3 w-3" />
                        )}
                        {pairing.successful ? 'Successful' : 'Unsuccessful'}
                      </span>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingPairing(pairing)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(pairing.id)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-sm text-warm-600 mb-3">
                  <span>Started: {formatDate(pairing.startDate)}</span>
                  {pairing.endDate && (
                    <span className="ml-4">Ended: {formatDate(pairing.endDate)}</span>
                  )}
                </div>
                {pairing.notes && (
                  <p className="text-sm text-warm-500 mb-3">{pairing.notes}</p>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleExpanded(pairing.id)}
                  className="w-full justify-center"
                >
                  {expandedPairingId === pairing.id ? (
                    <>
                      <ChevronUp className="h-4 w-4 mr-2" />
                      Hide Clutches
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-4 w-4 mr-2" />
                      Show Clutches
                    </>
                  )}
                </Button>
                {expandedPairingId === pairing.id && (
                  <div className="mt-4 pt-4 border-t border-warm-200">
                    <ClutchList pairingId={pairing.id} />
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
