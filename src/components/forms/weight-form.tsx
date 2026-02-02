'use client'

import { useFormState } from '@/hooks/use-form-state'
import { FormField, FormTextarea } from '@/components/ui/form-field'
import { FormButtons } from '@/components/ui/form-buttons'
import { useCreateWeight, useUpdateWeight } from '@/hooks/use-weights'
import type { Weight } from '@/generated/prisma/client'
import type { OfflineWeight } from '@/lib/offline/db'

interface WeightFormProps {
  reptileId: string
  weight?: Weight | OfflineWeight | null
  onSuccess: () => void
  onCancel?: () => void
  compact?: boolean
}

interface WeightFormValues extends Record<string, unknown> {
  date: string
  weight: string
  notes: string
}

function getInitialValues(weight?: Weight | OfflineWeight | null): WeightFormValues {
  const today = new Date().toISOString().split('T')[0]
  const weightDate = weight?.date
    ? typeof weight.date === 'number'
      ? new Date(weight.date).toISOString().split('T')[0]
      : new Date(weight.date).toISOString().split('T')[0]
    : today

  return {
    date: weightDate,
    weight: weight?.weight ? String(weight.weight) : '',
    notes: weight?.notes ?? '',
  }
}

function validateWeightForm(values: WeightFormValues): Partial<Record<keyof WeightFormValues, string>> {
  const errors: Partial<Record<keyof WeightFormValues, string>> = {}
  if (!values.date) errors.date = 'Date is required'
  if (!values.weight) errors.weight = 'Weight is required'
  else if (isNaN(parseFloat(values.weight))) errors.weight = 'Weight must be a number'
  else if (parseFloat(values.weight) <= 0) errors.weight = 'Weight must be positive'
  if (values.notes && values.notes.length > 2000) errors.notes = 'Notes must be 2000 characters or less'
  return errors
}

export function WeightForm({ reptileId, weight, onSuccess, onCancel, compact = false }: WeightFormProps) {
  const isEditing = !!weight
  const createWeight = useCreateWeight(reptileId)
  const updateWeight = useUpdateWeight(reptileId)
  const isPending = createWeight.isPending || updateWeight.isPending

  const { values, errors, handleChange, handleSubmit, resetForm } = useFormState({
    initialValues: getInitialValues(weight),
    validate: validateWeightForm,
    onSubmit: async (formValues) => {
      const payload = {
        date: new Date(formValues.date),
        weight: parseFloat(formValues.weight),
        notes: formValues.notes.trim() || null,
      }

      if (isEditing && weight) {
        await updateWeight.mutateAsync({ weightId: weight.id, data: payload })
      } else {
        await createWeight.mutateAsync(payload)
        if (compact) resetForm()
      }
      onSuccess()
    },
  })

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField
          id="weight-date"
          name="date"
          label="Date"
          type="date"
          required
          value={values.date}
          onChange={handleChange}
          error={errors.date}
        />
        <FormField
          id="weight-value"
          name="weight"
          label="Weight (grams)"
          type="number"
          required
          placeholder="e.g., 350"
          value={values.weight}
          onChange={handleChange}
          error={errors.weight}
          inputProps={{ min: '0', step: '0.1' }}
        />
      </div>

      <FormTextarea
        id="weight-notes"
        name="notes"
        label="Notes"
        rows={2}
        placeholder="Additional notes..."
        value={values.notes}
        onChange={handleChange}
        error={errors.notes}
      />

      <FormButtons
        isSubmitting={isPending}
        submitLabel={isEditing ? 'Update Weight' : compact ? 'Log Weight' : 'Add Weight'}
        submittingLabel={compact ? 'Logging...' : 'Saving...'}
        onCancel={onCancel}
        compact={compact}
      />
    </form>
  )
}
