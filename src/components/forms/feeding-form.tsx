'use client'

import { useFormState } from '@/hooks/use-form-state'
import { FormField, FormTextarea, FormCheckbox, FormSelect } from '@/components/ui/form-field'
import { FormButtons } from '@/components/ui/form-buttons'
import { useCreateFeeding, useUpdateFeeding } from '@/hooks/use-feedings'
import type { Feeding } from '@/generated/prisma/client'
import type { OfflineFeeding } from '@/lib/offline/db'

interface FeedingFormProps {
  reptileId: string
  feeding?: Feeding | OfflineFeeding | null
  onSuccess: () => void
  onCancel?: () => void
  compact?: boolean
}

interface FeedingFormValues extends Record<string, unknown> {
  date: string
  preyType: string
  preySize: string
  preySource: string
  accepted: boolean
  refused: boolean
  regurgitated: boolean
  notes: string
}

const preySourceOptions = [
  { value: 'FROZEN_THAWED', label: 'Frozen/Thawed' },
  { value: 'PRE_KILLED', label: 'Pre-killed' },
  { value: 'LIVE', label: 'Live' },
]

function formatDate(date: Date | number | null | undefined): string {
  if (!date) return new Date().toISOString().split('T')[0]
  return new Date(date).toISOString().split('T')[0]
}

function getInitialValues(feeding?: Feeding | OfflineFeeding | null): FeedingFormValues {
  return {
    date: formatDate(feeding?.date),
    preyType: feeding?.preyType ?? '',
    preySize: feeding?.preySize ?? '',
    preySource: feeding?.preySource ?? 'FROZEN_THAWED',
    accepted: feeding?.accepted ?? true,
    refused: feeding?.refused ?? false,
    regurgitated: feeding?.regurgitated ?? false,
    notes: feeding?.notes ?? '',
  }
}

function validateFeedingForm(values: FeedingFormValues): Partial<Record<keyof FeedingFormValues, string>> {
  const errors: Partial<Record<keyof FeedingFormValues, string>> = {}
  if (!values.date) errors.date = 'Date is required'
  if (!values.preyType.trim()) errors.preyType = 'Prey type is required'
  if (values.preyType.length > 100) errors.preyType = 'Prey type must be 100 characters or less'
  if (!values.preySize.trim()) errors.preySize = 'Prey size is required'
  if (values.preySize.length > 50) errors.preySize = 'Prey size must be 50 characters or less'
  if (!values.preySource) errors.preySource = 'Prey source is required'
  if (values.notes && values.notes.length > 2000) errors.notes = 'Notes must be 2000 characters or less'
  return errors
}

export function FeedingForm({ reptileId, feeding, onSuccess, onCancel, compact = false }: FeedingFormProps) {
  const isEditing = !!feeding
  const createFeeding = useCreateFeeding(reptileId)
  const updateFeeding = useUpdateFeeding(reptileId)
  const isPending = createFeeding.isPending || updateFeeding.isPending

  const { values, errors, handleChange, setFieldValue, handleSubmit, resetForm } = useFormState({
    initialValues: getInitialValues(feeding),
    validate: validateFeedingForm,
    onSubmit: async (formValues) => {
      const payload = {
        date: new Date(formValues.date),
        preyType: formValues.preyType.trim(),
        preySize: formValues.preySize.trim(),
        preySource: formValues.preySource as 'LIVE' | 'FROZEN_THAWED' | 'PRE_KILLED',
        accepted: formValues.accepted,
        refused: formValues.refused,
        regurgitated: formValues.regurgitated,
        notes: formValues.notes.trim() || null,
      }

      if (isEditing && feeding) {
        await updateFeeding.mutateAsync({ feedingId: feeding.id, data: payload })
      } else {
        await createFeeding.mutateAsync(payload)
        if (compact) resetForm()
      }
      onSuccess()
    },
  })

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <FormField id="feeding-date" name="date" label="Date" type="date" required
        value={values.date} onChange={handleChange} error={errors.date} />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField id="feeding-prey-type" name="preyType" label="Prey Type" required
          placeholder="e.g., Mouse, Rat" value={values.preyType} onChange={handleChange} error={errors.preyType} />
        <FormField id="feeding-prey-size" name="preySize" label="Prey Size" required
          placeholder="e.g., Small, Medium, Large" value={values.preySize} onChange={handleChange} error={errors.preySize} />
      </div>

      <FormSelect id="feeding-prey-source" label="Prey Source" required options={preySourceOptions}
        value={values.preySource} onValueChange={(v) => setFieldValue('preySource', v)} error={errors.preySource} />

      <div className="flex flex-wrap gap-4">
        <FormCheckbox id="feeding-accepted" name="accepted" label="Accepted"
          checked={values.accepted} onChange={handleChange} />
        <FormCheckbox id="feeding-refused" name="refused" label="Refused"
          checked={values.refused} onChange={handleChange} />
        <FormCheckbox id="feeding-regurgitated" name="regurgitated" label="Regurgitated"
          checked={values.regurgitated} onChange={handleChange} />
      </div>

      <FormTextarea id="feeding-notes" name="notes" label="Notes" rows={2}
        placeholder="Additional notes..." value={values.notes} onChange={handleChange} error={errors.notes} />

      <FormButtons isSubmitting={isPending} onCancel={onCancel} compact={compact}
        submitLabel={isEditing ? 'Update Feeding' : compact ? 'Log Feeding' : 'Add Feeding'}
        submittingLabel={compact ? 'Logging...' : 'Saving...'} />
    </form>
  )
}
