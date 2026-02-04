'use client'

import { useState, useCallback, memo, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { formatDate, daysUntil } from '@/lib/utils'
import { useClutches, useDeleteClutch } from '@/hooks/use-breeding'
import { ClutchForm } from './clutch-form'
import { HatchlingList } from './hatchling-list'
import { Plus, Egg, ChevronDown, ChevronUp, Trash2, Edit, Calendar } from 'lucide-react'
import type { Clutch } from '@/generated/prisma/client'

interface ClutchItemProps {
  clutch: Clutch
  isExpanded: boolean
  onToggleExpand: () => void
  onEdit: () => void
  onDelete: () => void
  isDeletePending: boolean
}

const ClutchItem = memo(function ClutchItem({
  clutch,
  isExpanded,
  onToggleExpand,
  onEdit,
  onDelete,
  isDeletePending,
}: ClutchItemProps) {
  const dueDays = useMemo(
    () => (clutch.dueDate ? daysUntil(clutch.dueDate) : null),
    [clutch.dueDate]
  )

  return (
    <Card className="bg-warm-50 dark:bg-warm-900">
      <CardContent className="py-3 px-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Egg className="h-4 w-4 text-amber-600" />
            <div>
              <p className="font-medium text-sm">
                {clutch.eggCount} eggs
                {clutch.fertileCount !== null &&
                  ` (${clutch.fertileCount} fertile)`}
              </p>
              <p className="text-xs text-warm-700 dark:text-warm-300">
                Laid: {formatDate(clutch.layDate)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {dueDays !== null && dueDays > 0 && (
              <span className="flex items-center gap-1 text-xs px-2 py-1 bg-amber-100 text-amber-900 rounded-full">
                <Calendar className="h-3 w-3" />
                {dueDays} days
              </span>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={onEdit}
              aria-label={`Edit clutch with ${clutch.eggCount} eggs`}
            >
              <Edit className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onDelete}
              disabled={isDeletePending}
              aria-label={`Delete clutch with ${clutch.eggCount} eggs`}
            >
              <Trash2 className="h-3 w-3 text-red-500" />
            </Button>
          </div>
        </div>
        {clutch.incubationTemp && (
          <p className="text-xs text-warm-700 dark:text-warm-300 mt-1">
            Incubation: {Number(clutch.incubationTemp).toFixed(1)}F
          </p>
        )}
        {clutch.notes && (
          <p className="text-xs text-warm-700 dark:text-warm-300 mt-1">{clutch.notes}</p>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleExpand}
          className="w-full justify-center mt-2 h-6 text-xs"
        >
          {isExpanded ? (
            <>
              <ChevronUp className="h-3 w-3 mr-1" />
              Hide Hatchlings
            </>
          ) : (
            <>
              <ChevronDown className="h-3 w-3 mr-1" />
              Show Hatchlings
            </>
          )}
        </Button>
        {isExpanded && (
          <div className="mt-3 pt-3 border-t border-warm-200">
            <HatchlingList clutchId={clutch.id} />
          </div>
        )}
      </CardContent>
    </Card>
  )
})

interface ClutchListProps {
  pairingId: string
}

export function ClutchList({ pairingId }: ClutchListProps) {
  const [showForm, setShowForm] = useState(false)
  const [editingClutch, setEditingClutch] = useState<Clutch | null>(null)
  const [expandedClutchId, setExpandedClutchId] = useState<string | null>(null)

  const { clutches, isPending, isError, refetch } = useClutches(pairingId)
  const deleteMutation = useDeleteClutch(pairingId)

  const handleDelete = useCallback(
    async (clutchId: string) => {
      if (confirm('Are you sure you want to delete this clutch?')) {
        await deleteMutation.mutateAsync(clutchId)
      }
    },
    [deleteMutation]
  )

  const toggleExpanded = useCallback((clutchId: string) => {
    setExpandedClutchId((prev) => (prev === clutchId ? null : clutchId))
  }, [])

  const handleShowForm = useCallback(() => {
    setShowForm(true)
  }, [])

  const handleEditClutch = useCallback((clutch: Clutch) => {
    setEditingClutch(clutch)
  }, [])

  const handleCloseDialog = useCallback(() => {
    setShowForm(false)
    setEditingClutch(null)
  }, [])

  if (isPending) {
    return (
      <div className="space-y-2">
        {[1, 2].map((i) => (
          <div key={i} className="animate-pulse bg-warm-100 dark:bg-warm-800 rounded p-4">
            <div className="h-3 bg-warm-200 dark:bg-warm-700 rounded w-1/4 mb-2" />
            <div className="h-2 bg-warm-200 dark:bg-warm-700 rounded w-1/3" />
          </div>
        ))}
      </div>
    )
  }

  if (isError) {
    return (
      <div className="text-center py-4">
        <p className="text-red-600 text-sm">Failed to load clutches</p>
        <Button onClick={() => refetch()} size="sm" className="mt-2">
          Retry
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <h4 className="text-sm font-medium text-warm-800 dark:text-warm-200">Clutches</h4>
        <Button onClick={handleShowForm} size="sm" variant="outline">
          <Plus className="h-3 w-3 mr-1" />
          Add Clutch
        </Button>
      </div>

      <Dialog
        open={showForm || !!editingClutch}
        onOpenChange={(open) => {
          if (!open) {
            handleCloseDialog()
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingClutch ? 'Edit Clutch' : 'New Clutch'}
            </DialogTitle>
            <DialogDescription className="sr-only">
              {editingClutch
                ? 'Edit the details of this clutch'
                : 'Record a new clutch of eggs for this pairing'}
            </DialogDescription>
          </DialogHeader>
          <ClutchForm
            pairingId={pairingId}
            clutch={editingClutch ?? undefined}
            onSuccess={handleCloseDialog}
            onCancel={handleCloseDialog}
          />
        </DialogContent>
      </Dialog>

      {clutches.length === 0 ? (
        <div className="text-center py-6 bg-warm-50 dark:bg-warm-900 rounded-lg">
          <Egg className="h-8 w-8 mx-auto mb-2 text-warm-300 dark:text-warm-600" />
          <p className="text-sm text-warm-700 dark:text-warm-300">No clutches recorded</p>
        </div>
      ) : (
        <div className="space-y-2">
          {clutches.map((clutch) => (
            <ClutchItem
              key={clutch.id}
              clutch={clutch}
              isExpanded={expandedClutchId === clutch.id}
              onToggleExpand={() => toggleExpanded(clutch.id)}
              onEdit={() => handleEditClutch(clutch)}
              onDelete={() => handleDelete(clutch.id)}
              isDeletePending={deleteMutation.isPending}
            />
          ))}
        </div>
      )}
    </div>
  )
}
