'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useCreateMedication, useUpdateMedication } from '@/hooks/use-vet'
import { Loader2, Check } from 'lucide-react'
import type { Medication } from '@/generated/prisma/client'

interface MedicationFormProps {
  reptileId: string
  medication?: Medication | null
  onSuccess: () => void
  onCancel?: () => void
  /** Compact mode for tracker tab layout (single full-width button) */
  compact?: boolean
}

export function MedicationForm({
  reptileId,
  medication,
  onSuccess,
  onCancel,
  compact = false,
}: MedicationFormProps) {
  const isEditing = !!medication
  const createMedication = useCreateMedication(reptileId)
  const updateMedication = useUpdateMedication()

  const [formData, setFormData] = useState({
    name: medication?.name ?? '',
    dosage: medication?.dosage ?? '',
    frequency: medication?.frequency ?? '',
    startDate: medication?.startDate
      ? new Date(medication.startDate).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0],
    endDate: medication?.endDate
      ? new Date(medication.endDate).toISOString().split('T')[0]
      : '',
    notes: medication?.notes ?? '',
    reminders: medication?.reminders ?? false,
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target
    const newValue =
      type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    setFormData((prev) => ({ ...prev, [name]: newValue }))
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }))
    }
  }

  const validate = () => {
    const newErrors: Record<string, string> = {}
    if (!formData.name.trim()) newErrors.name = 'Medication name is required'
    if (formData.name.length > 200)
      newErrors.name = 'Name must be 200 characters or less'
    if (!formData.dosage.trim()) newErrors.dosage = 'Dosage is required'
    if (formData.dosage.length > 100)
      newErrors.dosage = 'Dosage must be 100 characters or less'
    if (!formData.frequency.trim())
      newErrors.frequency = 'Frequency is required'
    if (formData.frequency.length > 100)
      newErrors.frequency = 'Frequency must be 100 characters or less'
    if (!formData.startDate) newErrors.startDate = 'Start date is required'
    if (
      formData.endDate &&
      formData.startDate &&
      new Date(formData.endDate) < new Date(formData.startDate)
    ) {
      newErrors.endDate = 'End date must be after start date'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const resetForm = () => {
    setFormData({
      name: '',
      dosage: '',
      frequency: '',
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
      notes: '',
      reminders: false,
    })
    setErrors({})
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    const payload = {
      name: formData.name.trim(),
      dosage: formData.dosage.trim(),
      frequency: formData.frequency.trim(),
      startDate: new Date(formData.startDate),
      endDate: formData.endDate ? new Date(formData.endDate) : null,
      notes: formData.notes.trim() || null,
      reminders: formData.reminders,
    }

    try {
      if (isEditing && medication) {
        await updateMedication.mutateAsync({
          medicationId: medication.id,
          data: payload,
        })
      } else {
        await createMedication.mutateAsync(payload)
        if (compact) {
          resetForm()
        }
      }
      onSuccess()
    } catch {
      // Error handling is done by the mutation hooks
    }
  }

  const isPending = createMedication.isPending || updateMedication.isPending

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label
          htmlFor="med-name"
          className="block text-sm font-medium text-warm-700 mb-1"
        >
          Medication Name <span className="text-red-500">*</span>
        </label>
        <Input
          id="med-name"
          name="name"
          placeholder="e.g., Metronidazole"
          value={formData.name}
          onChange={handleChange}
          aria-invalid={!!errors.name}
          aria-describedby={errors.name ? 'med-name-error' : undefined}
        />
        {errors.name && (
          <p
            id="med-name-error"
            className="mt-1 text-sm text-red-500"
            role="alert"
          >
            {errors.name}
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="dosage"
            className="block text-sm font-medium text-warm-700 mb-1"
          >
            Dosage <span className="text-red-500">*</span>
          </label>
          <Input
            id="dosage"
            name="dosage"
            placeholder="e.g., 25mg"
            value={formData.dosage}
            onChange={handleChange}
            aria-invalid={!!errors.dosage}
            aria-describedby={errors.dosage ? 'dosage-error' : undefined}
          />
          {errors.dosage && (
            <p
              id="dosage-error"
              className="mt-1 text-sm text-red-500"
              role="alert"
            >
              {errors.dosage}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="frequency"
            className="block text-sm font-medium text-warm-700 mb-1"
          >
            Frequency <span className="text-red-500">*</span>
          </label>
          <Input
            id="frequency"
            name="frequency"
            placeholder="e.g., Once daily"
            value={formData.frequency}
            onChange={handleChange}
            aria-invalid={!!errors.frequency}
            aria-describedby={errors.frequency ? 'frequency-error' : undefined}
          />
          {errors.frequency && (
            <p
              id="frequency-error"
              className="mt-1 text-sm text-red-500"
              role="alert"
            >
              {errors.frequency}
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="med-startDate"
            className="block text-sm font-medium text-warm-700 mb-1"
          >
            Start Date <span className="text-red-500">*</span>
          </label>
          <Input
            id="med-startDate"
            name="startDate"
            type="date"
            value={formData.startDate}
            onChange={handleChange}
            aria-invalid={!!errors.startDate}
            aria-describedby={errors.startDate ? 'med-startDate-error' : undefined}
          />
          {errors.startDate && (
            <p
              id="med-startDate-error"
              className="mt-1 text-sm text-red-500"
              role="alert"
            >
              {errors.startDate}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="med-endDate"
            className="block text-sm font-medium text-warm-700 mb-1"
          >
            End Date
          </label>
          <Input
            id="med-endDate"
            name="endDate"
            type="date"
            value={formData.endDate}
            onChange={handleChange}
            aria-invalid={!!errors.endDate}
            aria-describedby={errors.endDate ? 'med-endDate-error' : undefined}
          />
          {errors.endDate && (
            <p
              id="med-endDate-error"
              className="mt-1 text-sm text-red-500"
              role="alert"
            >
              {errors.endDate}
            </p>
          )}
        </div>
      </div>

      <div>
        <label
          htmlFor="med-notes"
          className="block text-sm font-medium text-warm-700 mb-1"
        >
          Notes
        </label>
        <textarea
          id="med-notes"
          name="notes"
          rows={3}
          placeholder="Additional notes about this medication..."
          value={formData.notes}
          onChange={handleChange}
          className="w-full rounded-md border border-warm-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] focus-visible:ring-offset-2"
        />
      </div>

      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          name="reminders"
          checked={formData.reminders}
          onChange={handleChange}
          className="h-4 w-4 rounded border-warm-300 text-primary focus:ring-primary"
        />
        <span className="text-sm text-warm-700">
          Enable reminders for this medication
        </span>
      </label>

      {compact ? (
        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? (
            <>
              <Loader2
                className="h-4 w-4 mr-2 animate-spin"
                aria-hidden="true"
              />
              Adding...
            </>
          ) : (
            <>
              <Check className="h-4 w-4 mr-2" aria-hidden="true" />
              Add Medication
            </>
          )}
        </Button>
      ) : (
        <div className="flex justify-end gap-3 pt-2">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isPending}
            >
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={isPending}>
            {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {isEditing ? 'Update Medication' : 'Add Medication'}
          </Button>
        </div>
      )}
    </form>
  )
}
