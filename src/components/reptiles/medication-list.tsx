'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { formatDate } from '@/lib/utils'
import { useMedications, useDeleteMedication } from '@/hooks/use-vet'
import { MedicationForm } from './medication-form'
import {
  Plus,
  Pill,
  Calendar,
  Clock,
  Bell,
  Pencil,
  Trash2,
  AlertCircle,
  Loader2,
  CheckCircle2,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import type { Medication } from '@/generated/prisma/client'

interface MedicationListProps {
  reptileId: string
}

export function MedicationList({ reptileId }: MedicationListProps) {
  const [showForm, setShowForm] = useState(false)
  const [editingMedication, setEditingMedication] = useState<Medication | null>(null)
  const { medications, isPending, isError, error } = useMedications(reptileId)
  const deleteMedication = useDeleteMedication()

  const handleEdit = (medication: Medication) => {
    setEditingMedication(medication)
    setShowForm(true)
  }

  const handleDelete = async (medicationId: string) => {
    if (confirm('Are you sure you want to delete this medication?')) {
      deleteMedication.mutate(medicationId)
    }
  }

  const handleFormClose = () => {
    setShowForm(false)
    setEditingMedication(null)
  }

  // Separate active and completed medications
  const now = new Date()
  const activeMedications = medications.filter(
    (med) => !med.endDate || new Date(med.endDate) >= now
  )
  const completedMedications = medications.filter(
    (med) => med.endDate && new Date(med.endDate) < now
  )

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
          <p className="text-warm-600">Failed to load medications</p>
          <p className="text-sm text-warm-500">{error?.message}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Medications</h3>
        <Button onClick={() => setShowForm(true)} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Medication
        </Button>
      </div>

      <Dialog open={showForm} onOpenChange={handleFormClose}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingMedication ? 'Edit Medication' : 'Add Medication'}
            </DialogTitle>
            <DialogDescription>
              {editingMedication
                ? 'Update the medication details.'
                : 'Add a new medication for tracking.'}
            </DialogDescription>
          </DialogHeader>
          <MedicationForm
            reptileId={reptileId}
            medication={editingMedication}
            onSuccess={handleFormClose}
            onCancel={handleFormClose}
          />
        </DialogContent>
      </Dialog>

      {medications.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Pill className="h-12 w-12 mx-auto mb-4 text-warm-300" />
            <p className="text-warm-600">No medications recorded</p>
            <p className="text-sm text-warm-500">Click &quot;Add Medication&quot; to add one</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {activeMedications.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-warm-600 uppercase tracking-wide">
                Active Medications
              </h4>
              {activeMedications.map((medication) => (
                <MedicationCard
                  key={medication.id}
                  medication={medication}
                  onEdit={() => handleEdit(medication)}
                  onDelete={() => handleDelete(medication.id)}
                  isDeleting={deleteMedication.isPending}
                  isActive
                />
              ))}
            </div>
          )}

          {completedMedications.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-warm-500 uppercase tracking-wide">
                Completed
              </h4>
              {completedMedications.map((medication) => (
                <MedicationCard
                  key={medication.id}
                  medication={medication}
                  onEdit={() => handleEdit(medication)}
                  onDelete={() => handleDelete(medication.id)}
                  isDeleting={deleteMedication.isPending}
                  isActive={false}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

interface MedicationCardProps {
  medication: Medication
  onEdit: () => void
  onDelete: () => void
  isDeleting: boolean
  isActive: boolean
}

function MedicationCard({ medication, onEdit, onDelete, isDeleting, isActive }: MedicationCardProps) {
  return (
    <Card className={`hover:shadow-sm transition-shadow ${!isActive ? 'opacity-60' : ''}`}>
      <CardContent className="py-4 px-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              {isActive ? (
                <Pill className="h-4 w-4 text-blue-500" />
              ) : (
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              )}
              <h4 className="font-medium text-warm-900">{medication.name}</h4>
              {medication.reminders && isActive && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                  <Bell className="h-3 w-3" />
                  Reminders
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-warm-500 mt-1">
              <span className="font-medium text-warm-700">{medication.dosage}</span>
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {medication.frequency}
              </span>
            </div>

            <div className="flex items-center gap-2 text-sm text-warm-500 mt-2">
              <Calendar className="h-3.5 w-3.5" />
              <span>
                {formatDate(medication.startDate)}
                {medication.endDate && ` - ${formatDate(medication.endDate)}`}
              </span>
            </div>

            {medication.notes && (
              <p className="mt-2 text-sm text-warm-500 italic">{medication.notes}</p>
            )}
          </div>

          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" onClick={onEdit} aria-label="Edit medication">
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onDelete}
              disabled={isDeleting}
              aria-label="Delete medication"
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
