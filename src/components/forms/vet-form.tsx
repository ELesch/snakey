'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useCreateVetVisit, useUpdateVetVisit } from '@/hooks/use-vet'
import { Loader2, Check } from 'lucide-react'
import type { VetVisit } from '@/generated/prisma/client'

interface VetFormProps {
  reptileId: string
  visit?: VetVisit | null
  onSuccess: () => void
  onCancel?: () => void
  /** Compact mode for tracker tab layout (single full-width button) */
  compact?: boolean
}

export function VetForm({
  reptileId,
  visit,
  onSuccess,
  onCancel,
  compact = false,
}: VetFormProps) {
  const isEditing = !!visit
  const createVisit = useCreateVetVisit(reptileId)
  const updateVisit = useUpdateVetVisit()

  const [formData, setFormData] = useState({
    date: visit?.date
      ? new Date(visit.date).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0],
    reason: visit?.reason ?? '',
    diagnosis: visit?.diagnosis ?? '',
    treatment: visit?.treatment ?? '',
    vetName: visit?.vetName ?? '',
    vetClinic: visit?.vetClinic ?? '',
    cost: visit?.cost ? String(visit.cost) : '',
    followUp: visit?.followUp
      ? new Date(visit.followUp).toISOString().split('T')[0]
      : '',
    notes: visit?.notes ?? '',
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }))
    }
  }

  const validate = () => {
    const newErrors: Record<string, string> = {}
    if (!formData.date) newErrors.date = 'Date is required'
    if (!formData.reason.trim()) newErrors.reason = 'Reason is required'
    if (formData.reason.length > 500)
      newErrors.reason = 'Reason must be 500 characters or less'
    if (formData.cost && isNaN(parseFloat(formData.cost)))
      newErrors.cost = 'Cost must be a number'
    if (formData.cost && parseFloat(formData.cost) < 0)
      newErrors.cost = 'Cost must be non-negative'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const resetForm = () => {
    setFormData({
      date: new Date().toISOString().split('T')[0],
      reason: '',
      diagnosis: '',
      treatment: '',
      vetName: '',
      vetClinic: '',
      cost: '',
      followUp: '',
      notes: '',
    })
    setErrors({})
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    const payload = {
      date: new Date(formData.date),
      reason: formData.reason.trim(),
      diagnosis: formData.diagnosis.trim() || null,
      treatment: formData.treatment.trim() || null,
      vetName: formData.vetName.trim() || null,
      vetClinic: formData.vetClinic.trim() || null,
      cost: formData.cost ? parseFloat(formData.cost) : null,
      followUp: formData.followUp ? new Date(formData.followUp) : null,
      notes: formData.notes.trim() || null,
    }

    try {
      if (isEditing && visit) {
        await updateVisit.mutateAsync({ visitId: visit.id, data: payload })
      } else {
        await createVisit.mutateAsync(payload)
        if (compact) {
          resetForm()
        }
      }
      onSuccess()
    } catch {
      // Error handling is done by the mutation hooks
    }
  }

  const isPending = createVisit.isPending || updateVisit.isPending

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="vet-date"
            className="block text-sm font-medium text-warm-700 mb-1"
          >
            Date <span className="text-red-500">*</span>
          </label>
          <Input
            id="vet-date"
            name="date"
            type="date"
            value={formData.date}
            onChange={handleChange}
            aria-invalid={!!errors.date}
            aria-describedby={errors.date ? 'vet-date-error' : undefined}
          />
          {errors.date && (
            <p
              id="vet-date-error"
              className="mt-1 text-sm text-red-500"
              role="alert"
            >
              {errors.date}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="cost"
            className="block text-sm font-medium text-warm-700 mb-1"
          >
            Cost ($)
          </label>
          <Input
            id="cost"
            name="cost"
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            value={formData.cost}
            onChange={handleChange}
            aria-invalid={!!errors.cost}
            aria-describedby={errors.cost ? 'cost-error' : undefined}
          />
          {errors.cost && (
            <p
              id="cost-error"
              className="mt-1 text-sm text-red-500"
              role="alert"
            >
              {errors.cost}
            </p>
          )}
        </div>
      </div>

      <div>
        <label
          htmlFor="reason"
          className="block text-sm font-medium text-warm-700 mb-1"
        >
          Reason for Visit <span className="text-red-500">*</span>
        </label>
        <Input
          id="reason"
          name="reason"
          placeholder="e.g., Annual checkup, respiratory issue"
          value={formData.reason}
          onChange={handleChange}
          aria-invalid={!!errors.reason}
          aria-describedby={errors.reason ? 'reason-error' : undefined}
        />
        {errors.reason && (
          <p
            id="reason-error"
            className="mt-1 text-sm text-red-500"
            role="alert"
          >
            {errors.reason}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="vetName"
            className="block text-sm font-medium text-warm-700 mb-1"
          >
            Veterinarian Name
          </label>
          <Input
            id="vetName"
            name="vetName"
            placeholder="Dr. Smith"
            value={formData.vetName}
            onChange={handleChange}
          />
        </div>

        <div>
          <label
            htmlFor="vetClinic"
            className="block text-sm font-medium text-warm-700 mb-1"
          >
            Clinic
          </label>
          <Input
            id="vetClinic"
            name="vetClinic"
            placeholder="Exotic Pet Clinic"
            value={formData.vetClinic}
            onChange={handleChange}
          />
        </div>
      </div>

      <div>
        <label
          htmlFor="diagnosis"
          className="block text-sm font-medium text-warm-700 mb-1"
        >
          Diagnosis
        </label>
        <textarea
          id="diagnosis"
          name="diagnosis"
          rows={2}
          placeholder="What was diagnosed..."
          value={formData.diagnosis}
          onChange={handleChange}
          className="w-full rounded-md border border-warm-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] focus-visible:ring-offset-2"
        />
      </div>

      <div>
        <label
          htmlFor="treatment"
          className="block text-sm font-medium text-warm-700 mb-1"
        >
          Treatment
        </label>
        <textarea
          id="treatment"
          name="treatment"
          rows={2}
          placeholder="Treatment prescribed..."
          value={formData.treatment}
          onChange={handleChange}
          className="w-full rounded-md border border-warm-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] focus-visible:ring-offset-2"
        />
      </div>

      <div>
        <label
          htmlFor="followUp"
          className="block text-sm font-medium text-warm-700 mb-1"
        >
          Follow-up Date
        </label>
        <Input
          id="followUp"
          name="followUp"
          type="date"
          value={formData.followUp}
          onChange={handleChange}
        />
      </div>

      <div>
        <label
          htmlFor="vet-notes"
          className="block text-sm font-medium text-warm-700 mb-1"
        >
          Notes
        </label>
        <textarea
          id="vet-notes"
          name="notes"
          rows={2}
          placeholder="Additional notes..."
          value={formData.notes}
          onChange={handleChange}
          className="w-full rounded-md border border-warm-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] focus-visible:ring-offset-2"
        />
      </div>

      {compact ? (
        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? (
            <>
              <Loader2
                className="h-4 w-4 mr-2 animate-spin"
                aria-hidden="true"
              />
              Logging...
            </>
          ) : (
            <>
              <Check className="h-4 w-4 mr-2" aria-hidden="true" />
              Log Vet Visit
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
            {isEditing ? 'Update Visit' : 'Add Visit'}
          </Button>
        </div>
      )}
    </form>
  )
}
