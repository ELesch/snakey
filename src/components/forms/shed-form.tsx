'use client'

import { useFormState } from '@/hooks/use-form-state'
import { FormField, FormTextarea, FormSelect } from '@/components/ui/form-field'
import { FormButtons } from '@/components/ui/form-buttons'
import { useCreateShed, useUpdateShed } from '@/hooks/use-sheds'
import type { Shed } from '@/generated/prisma/client'
import type { OfflineShed } from '@/lib/offline/db'

interface ShedFormProps {
  reptileId: string
  shed?: Shed | OfflineShed | null
  onSuccess: () => void
  onCancel?: () => void
  compact?: boolean
}

interface ShedFormValues extends Record<string, unknown> {
  startDate: string
  completedDate: string
  quality: string
  issues: string
  notes: string
}

const qualityOptions = [
  { value: 'COMPLETE', label: 'Complete - One piece' },
  { value: 'PARTIAL', label: 'Partial - Multiple pieces' },
  { value: 'PROBLEMATIC', label: 'Problematic - Stuck shed' },
]

function formatDate(date: Date | number | null | undefined, fallback: string = ''): string {
  if (!date) return fallback
  return new Date(date).toISOString().split('T')[0]
}

function getInitialValues(shed?: Shed | OfflineShed | null): ShedFormValues {
  const today = new Date().toISOString().split('T')[0]
  return {
    startDate: formatDate(shed?.startDate),
    completedDate: formatDate(shed?.completedDate, today),
    quality: shed?.quality ?? 'COMPLETE',
    issues: shed?.issues ?? '',
    notes: shed?.notes ?? '',
  }
}

function validateShedForm(values: ShedFormValues): Partial<Record<keyof ShedFormValues, string>> {
  const errors: Partial<Record<keyof ShedFormValues, string>> = {}
  if (!values.completedDate) errors.completedDate = 'Completed date is required'
  if (!values.quality) errors.quality = 'Quality is required'
  if (values.startDate && values.completedDate && values.startDate > values.completedDate) {
    errors.completedDate = 'Completed date cannot be before start date'
  }
  if (values.issues && values.issues.length > 500) errors.issues = 'Issues must be 500 characters or less'
  if (values.notes && values.notes.length > 2000) errors.notes = 'Notes must be 2000 characters or less'
  return errors
}

export function ShedForm({ reptileId, shed, onSuccess, onCancel, compact = false }: ShedFormProps) {
  const isEditing = !!shed
  const createShed = useCreateShed(reptileId)
  const updateShed = useUpdateShed(reptileId)
  const isPending = createShed.isPending || updateShed.isPending

  const { values, errors, handleChange, setFieldValue, handleSubmit, resetForm } = useFormState({
    initialValues: getInitialValues(shed),
    validate: validateShedForm,
    onSubmit: async (formValues) => {
      const payload = {
        startDate: formValues.startDate ? new Date(formValues.startDate) : null,
        completedDate: new Date(formValues.completedDate),
        quality: formValues.quality as 'COMPLETE' | 'PARTIAL' | 'PROBLEMATIC',
        isComplete: formValues.quality === 'COMPLETE',
        issues: formValues.issues.trim() || null,
        notes: formValues.notes.trim() || null,
      }

      if (isEditing && shed) {
        await updateShed.mutateAsync({ shedId: shed.id, data: payload })
      } else {
        await createShed.mutateAsync(payload)
        if (compact) resetForm()
      }
      onSuccess()
    },
  })

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField id="shed-start-date" name="startDate" label="Start Date (optional)" type="date"
          value={values.startDate} onChange={handleChange} error={errors.startDate} />
        <FormField id="shed-completed-date" name="completedDate" label="Completed Date" type="date" required
          value={values.completedDate} onChange={handleChange} error={errors.completedDate} />
      </div>

      <FormSelect id="shed-quality" label="Quality" required options={qualityOptions}
        value={values.quality} onValueChange={(v) => setFieldValue('quality', v)} error={errors.quality} />

      <FormTextarea id="shed-issues" name="issues" label="Issues" rows={2}
        placeholder="Any issues with the shed..." value={values.issues} onChange={handleChange} error={errors.issues} />

      <FormTextarea id="shed-notes" name="notes" label="Notes" rows={2}
        placeholder="Additional notes..." value={values.notes} onChange={handleChange} error={errors.notes} />

      <FormButtons isSubmitting={isPending} onCancel={onCancel} compact={compact}
        submitLabel={isEditing ? 'Update Shed' : compact ? 'Log Shed' : 'Add Shed'}
        submittingLabel={compact ? 'Logging...' : 'Saving...'} />
    </form>
  )
}
