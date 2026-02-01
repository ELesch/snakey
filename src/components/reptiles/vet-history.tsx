'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { formatDate } from '@/lib/utils'
import { useVetVisits, useDeleteVetVisit } from '@/hooks/use-vet'
import { VetForm } from '@/components/forms'
import {
  Plus,
  Stethoscope,
  Calendar,
  DollarSign,
  Building2,
  Pencil,
  Trash2,
  AlertCircle,
  Loader2,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import type { VetVisit } from '@/generated/prisma/client'

interface VetHistoryProps {
  reptileId: string
}

export function VetHistory({ reptileId }: VetHistoryProps) {
  const [showForm, setShowForm] = useState(false)
  const [editingVisit, setEditingVisit] = useState<VetVisit | null>(null)
  const { visits, isPending, isError, error } = useVetVisits(reptileId)
  const deleteVisit = useDeleteVetVisit()

  const handleEdit = (visit: VetVisit) => {
    setEditingVisit(visit)
    setShowForm(true)
  }

  const handleDelete = async (visitId: string) => {
    if (confirm('Are you sure you want to delete this vet visit?')) {
      deleteVisit.mutate(visitId)
    }
  }

  const handleFormClose = () => {
    setShowForm(false)
    setEditingVisit(null)
  }

  if (isPending) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-warm-400" />
      </div>
    )
  }

  if (isError) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-400" />
          <p className="text-warm-600">Failed to load vet visits</p>
          <p className="text-sm text-warm-500">{error?.message}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Vet History</h3>
        <Button onClick={() => setShowForm(true)} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Visit
        </Button>
      </div>

      <Dialog open={showForm} onOpenChange={handleFormClose}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingVisit ? 'Edit Vet Visit' : 'Add Vet Visit'}</DialogTitle>
            <DialogDescription>
              {editingVisit ? 'Update the vet visit details.' : 'Record a new vet visit.'}
            </DialogDescription>
          </DialogHeader>
          <VetForm
            reptileId={reptileId}
            visit={editingVisit}
            onSuccess={handleFormClose}
            onCancel={handleFormClose}
          />
        </DialogContent>
      </Dialog>

      {visits.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Stethoscope className="h-12 w-12 mx-auto mb-4 text-warm-300" />
            <p className="text-warm-600">No vet visits recorded</p>
            <p className="text-sm text-warm-500">Click &quot;Add Visit&quot; to add one</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {visits.map((visit) => (
            <VetVisitCard
              key={visit.id}
              visit={visit}
              onEdit={() => handleEdit(visit)}
              onDelete={() => handleDelete(visit.id)}
              isDeleting={deleteVisit.isPending}
            />
          ))}
        </div>
      )}
    </div>
  )
}

interface VetVisitCardProps {
  visit: VetVisit
  onEdit: () => void
  onDelete: () => void
  isDeleting: boolean
}

function VetVisitCard({ visit, onEdit, onDelete, isDeleting }: VetVisitCardProps) {
  const hasFollowUp = visit.followUp && new Date(visit.followUp) > new Date()

  return (
    <Card className="hover:shadow-sm transition-shadow">
      <CardContent className="py-4 px-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-medium text-warm-900 truncate">{visit.reason}</h4>
              {hasFollowUp && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800">
                  Follow-up needed
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-warm-500">
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {formatDate(visit.date)}
              </span>
              {visit.vetClinic && (
                <span className="flex items-center gap-1">
                  <Building2 className="h-3.5 w-3.5" />
                  {visit.vetClinic}
                </span>
              )}
              {visit.cost && (
                <span className="flex items-center gap-1">
                  <DollarSign className="h-3.5 w-3.5" />
                  {Number(visit.cost).toFixed(2)}
                </span>
              )}
            </div>

            {visit.diagnosis && (
              <p className="mt-2 text-sm text-warm-600">
                <span className="font-medium">Diagnosis:</span> {visit.diagnosis}
              </p>
            )}

            {visit.treatment && (
              <p className="mt-1 text-sm text-warm-600">
                <span className="font-medium">Treatment:</span> {visit.treatment}
              </p>
            )}

            {visit.notes && (
              <p className="mt-1 text-sm text-warm-500 italic">{visit.notes}</p>
            )}
          </div>

          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" onClick={onEdit} aria-label="Edit visit">
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onDelete}
              disabled={isDeleting}
              aria-label="Delete visit"
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
