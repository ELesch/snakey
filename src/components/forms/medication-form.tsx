'use client'

import { useFormState } from '@/hooks/use-form-state'
import { FormField, FormTextarea, FormCheckbox } from '@/components/ui/form-field'
import { FormButtons } from '@/components/ui/form-buttons'
import { useCreateMedication, useUpdateMedication } from '@/hooks/use-vet'
import type { Medication } from '@/generated/prisma/client'

interface MedicationFormProps {
  reptileId: string
  medication?: Medication | null
  onSuccess: () => void
  onCancel?: () => void
  compact?: boolean
}

interface MedicationFormValues extends Record<string, unknown> {
  name: string
  dosage: string
  frequency: string
  startDate: string
  endDate: string
  notes: string
  reminders: boolean
}

function getInitialValues(medication?: Medication | null): MedicationFormValues {
  const today = new Date().toISOString().split('T')[0]
  return {
    name: medication?.name ?? '',
    dosage: medication?.dosage ?? '',
    frequency: medication?.frequency ?? '',
    startDate: medication?.startDate
      ? new Date(medication.startDate).toISOString().split('T')[0] : today,
    endDate: medication?.endDate
      ? new Date(medication.endDate).toISOString().split('T')[0] : '',
    notes: medication?.notes ?? '',
    reminders: medication?.reminders ?? false,
  }
}

function validateMedicationForm(
  values: MedicationFormValues
): Partial<Record<keyof MedicationFormValues, string>> {
  const errors: Partial<Record<keyof MedicationFormValues, string>> = {}
  if (!values.name.trim()) errors.name = 'Medication name is required'
  if (values.name.length > 200) errors.name = 'Name must be 200 characters or less'
  if (!values.dosage.trim()) errors.dosage = 'Dosage is required'
  if (values.dosage.length > 100) errors.dosage = 'Dosage must be 100 characters or less'
  if (!values.frequency.trim()) errors.frequency = 'Frequency is required'
  if (values.frequency.length > 100) errors.frequency = 'Frequency must be 100 characters or less'
  if (!values.startDate) errors.startDate = 'Start date is required'
  if (values.endDate && values.startDate && new Date(values.endDate) < new Date(values.startDate)) {
    errors.endDate = 'End date must be after start date'
  }
  return errors
}

export function MedicationForm({
  reptileId, medication, onSuccess, onCancel, compact = false,
}: MedicationFormProps) {
  const isEditing = !!medication
  const createMedication = useCreateMedication(reptileId)
  const updateMedication = useUpdateMedication()
  const isPending = createMedication.isPending || updateMedication.isPending

  const { values, errors, handleChange, handleSubmit, resetForm } = useFormState({
    initialValues: getInitialValues(medication),
    validate: validateMedicationForm,
    onSubmit: async (formValues) => {
      const payload = {
        name: formValues.name.trim(),
        dosage: formValues.dosage.trim(),
        frequency: formValues.frequency.trim(),
        startDate: new Date(formValues.startDate),
        endDate: formValues.endDate ? new Date(formValues.endDate) : null,
        notes: formValues.notes.trim() || null,
        reminders: formValues.reminders,
      }
      if (isEditing && medication) {
        await updateMedication.mutateAsync({ medicationId: medication.id, data: payload })
      } else {
        await createMedication.mutateAsync(payload)
        if (compact) resetForm()
      }
      onSuccess()
    },
  })

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <FormField id="med-name" name="name" label="Medication Name" required
        placeholder="e.g., Metronidazole"
        value={values.name} onChange={handleChange} error={errors.name} />

      <div className="grid grid-cols-2 gap-4">
        <FormField id="dosage" name="dosage" label="Dosage" required placeholder="e.g., 25mg"
          value={values.dosage} onChange={handleChange} error={errors.dosage} />
        <FormField id="frequency" name="frequency" label="Frequency" required
          placeholder="e.g., Once daily"
          value={values.frequency} onChange={handleChange} error={errors.frequency} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <FormField id="med-startDate" name="startDate" label="Start Date" type="date" required
          value={values.startDate} onChange={handleChange} error={errors.startDate} />
        <FormField id="med-endDate" name="endDate" label="End Date" type="date"
          value={values.endDate} onChange={handleChange} error={errors.endDate} />
      </div>

      <FormTextarea id="med-notes" name="notes" label="Notes" rows={3}
        placeholder="Additional notes about this medication..."
        value={values.notes} onChange={handleChange} />

      <FormCheckbox id="reminders" name="reminders"
        label="Enable reminders for this medication"
        checked={values.reminders as boolean} onChange={handleChange} />

      <FormButtons isSubmitting={isPending} onCancel={onCancel} compact={compact}
        submitLabel={isEditing ? 'Update Medication' : 'Add Medication'}
        submittingLabel={compact ? 'Adding...' : 'Saving...'} />
    </form>
  )
}
