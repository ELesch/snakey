'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
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
  DEVELOPING: 'bg-blue-100 text-blue-700',
  HATCHED: 'bg-green-100 text-green-700',
  FAILED: 'bg-red-100 text-red-700',
  SOLD: 'bg-purple-100 text-purple-700',
  KEPT: 'bg-amber-100 text-amber-700',
}

const statusLabels: Record<string, string> = {
  DEVELOPING: 'Developing',
  HATCHED: 'Hatched',
  FAILED: 'Failed',
  SOLD: 'Sold',
  KEPT: 'Kept',
}

export function HatchlingList({ clutchId }: HatchlingListProps) {
  const [showForm, setShowForm] = useState(false)
  const [editingHatchling, setEditingHatchling] = useState<Hatchling | null>(null)

  const { hatchlings, isPending, isError, refetch } = useHatchlings(clutchId)
  const deleteMutation = useDeleteHatchling(clutchId)

  const handleDelete = async (hatchlingId: string) => {
    if (confirm('Are you sure you want to delete this hatchling?')) {
      await deleteMutation.mutateAsync(hatchlingId)
    }
  }

  if (isPending) {
    return (
      <div className="space-y-2">
        {[1, 2].map((i) => (
          <div key={i} className="animate-pulse bg-warm-100 rounded p-2">
            <div className="h-2 bg-warm-200 rounded w-1/4" />
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
        <h5 className="text-xs font-medium text-warm-600">Hatchlings</h5>
        <Button onClick={() => setShowForm(true)} size="sm" variant="ghost" className="h-6 text-xs">
          <Plus className="h-3 w-3 mr-1" />
          Add
        </Button>
      </div>

      <Dialog
        open={showForm || !!editingHatchling}
        onOpenChange={(open) => {
          if (!open) {
            setShowForm(false)
            setEditingHatchling(null)
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingHatchling ? 'Edit Hatchling' : 'New Hatchling'}
            </DialogTitle>
          </DialogHeader>
          <HatchlingForm
            clutchId={clutchId}
            hatchling={editingHatchling ?? undefined}
            onSuccess={() => {
              setShowForm(false)
              setEditingHatchling(null)
            }}
            onCancel={() => {
              setShowForm(false)
              setEditingHatchling(null)
            }}
          />
        </DialogContent>
      </Dialog>

      {hatchlings.length === 0 ? (
        <div className="text-center py-4 bg-warm-100/50 rounded">
          <Baby className="h-6 w-6 mx-auto mb-1 text-warm-300" />
          <p className="text-xs text-warm-500">No hatchlings recorded</p>
        </div>
      ) : (
        <div className="space-y-1">
          {hatchlings.map((hatchling, index) => (
            <div
              key={hatchling.id}
              className="flex items-center justify-between bg-white rounded p-2 border border-warm-100"
            >
              <div className="flex items-center gap-2">
                <Baby className="h-3 w-3 text-warm-400" />
                <div>
                  <p className="text-xs font-medium">
                    #{index + 1}
                    {hatchling.morph && ` - ${hatchling.morph}`}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-warm-500">
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
                  onClick={() => setEditingHatchling(hatchling)}
                  className="h-6 w-6 p-0"
                >
                  <Edit className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(hatchling.id)}
                  disabled={deleteMutation.isPending}
                  className="h-6 w-6 p-0"
                >
                  <Trash2 className="h-3 w-3 text-red-500" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
