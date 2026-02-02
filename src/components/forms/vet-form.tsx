'use client'

import { useFormState } from '@/hooks/use-form-state'
import { FormField, FormTextarea } from '@/components/ui/form-field'
import { FormButtons } from '@/components/ui/form-buttons'
import { useCreateVetVisit, useUpdateVetVisit } from '@/hooks/use-vet'
import type { VetVisit } from '@/generated/prisma/client'

interface VetFormProps {
  reptileId: string
  visit?: VetVisit | null
  onSuccess: () => void
  onCancel?: () => void
  compact?: boolean
}

interface VetFormValues extends Record<string, unknown> {
  date: string
  reason: string
  diagnosis: string
  treatment: string
  vetName: string
  vetClinic: string
  cost: string
  followUp: string
  notes: string
}

function getInitialValues(visit?: VetVisit | null): VetFormValues {
  const today = new Date().toISOString().split('T')[0]
  return {
    date: visit?.date ? new Date(visit.date).toISOString().split('T')[0] : today,
    reason: visit?.reason ?? '',
    diagnosis: visit?.diagnosis ?? '',
    treatment: visit?.treatment ?? '',
    vetName: visit?.vetName ?? '',
    vetClinic: visit?.vetClinic ?? '',
    cost: visit?.cost ? String(visit.cost) : '',
    followUp: visit?.followUp ? new Date(visit.followUp).toISOString().split('T')[0] : '',
    notes: visit?.notes ?? '',
  }
}

function validateVetForm(values: VetFormValues): Partial<Record<keyof VetFormValues, string>> {
  const errors: Partial<Record<keyof VetFormValues, string>> = {}
  if (!values.date) errors.date = 'Date is required'
  if (!values.reason.trim()) errors.reason = 'Reason is required'
  if (values.reason.length > 500) errors.reason = 'Reason must be 500 characters or less'
  if (values.cost && isNaN(parseFloat(values.cost))) errors.cost = 'Cost must be a number'
  if (values.cost && parseFloat(values.cost) < 0) errors.cost = 'Cost must be non-negative'
  return errors
}

export function VetForm({ reptileId, visit, onSuccess, onCancel, compact = false }: VetFormProps) {
  const isEditing = !!visit
  const createVisit = useCreateVetVisit(reptileId)
  const updateVisit = useUpdateVetVisit()
  const isPending = createVisit.isPending || updateVisit.isPending

  const { values, errors, handleChange, handleSubmit, resetForm } = useFormState({
    initialValues: getInitialValues(visit),
    validate: validateVetForm,
    onSubmit: async (formValues) => {
      const payload = {
        date: new Date(formValues.date),
        reason: formValues.reason.trim(),
        diagnosis: formValues.diagnosis.trim() || null,
        treatment: formValues.treatment.trim() || null,
        vetName: formValues.vetName.trim() || null,
        vetClinic: formValues.vetClinic.trim() || null,
        cost: formValues.cost ? parseFloat(formValues.cost) : null,
        followUp: formValues.followUp ? new Date(formValues.followUp) : null,
        notes: formValues.notes.trim() || null,
      }
      if (isEditing && visit) {
        await updateVisit.mutateAsync({ visitId: visit.id, data: payload })
      } else {
        await createVisit.mutateAsync(payload)
        if (compact) resetForm()
      }
      onSuccess()
    },
  })

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField id="vet-date" name="date" label="Date" type="date" required
          value={values.date} onChange={handleChange} error={errors.date} />
        <FormField id="cost" name="cost" label="Cost ($)" type="number" placeholder="0.00"
          value={values.cost} onChange={handleChange} error={errors.cost}
          inputProps={{ step: '0.01', min: '0' }} />
      </div>

      <FormField id="reason" name="reason" label="Reason for Visit" required
        placeholder="e.g., Annual checkup, respiratory issue"
        value={values.reason} onChange={handleChange} error={errors.reason} />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField id="vetName" name="vetName" label="Veterinarian Name" placeholder="Dr. Smith"
          value={values.vetName} onChange={handleChange} />
        <FormField id="vetClinic" name="vetClinic" label="Clinic" placeholder="Exotic Pet Clinic"
          value={values.vetClinic} onChange={handleChange} />
      </div>

      <FormTextarea id="diagnosis" name="diagnosis" label="Diagnosis" rows={2}
        placeholder="What was diagnosed..." value={values.diagnosis} onChange={handleChange} />

      <FormTextarea id="treatment" name="treatment" label="Treatment" rows={2}
        placeholder="Treatment prescribed..." value={values.treatment} onChange={handleChange} />

      <FormField id="followUp" name="followUp" label="Follow-up Date" type="date"
        value={values.followUp} onChange={handleChange} />

      <FormTextarea id="vet-notes" name="notes" label="Notes" rows={2}
        placeholder="Additional notes..." value={values.notes} onChange={handleChange} />

      <FormButtons isSubmitting={isPending} onCancel={onCancel} compact={compact}
        submitLabel={isEditing ? 'Update Visit' : compact ? 'Log Vet Visit' : 'Add Visit'}
        submittingLabel={compact ? 'Logging...' : 'Saving...'} />
    </form>
  )
}
