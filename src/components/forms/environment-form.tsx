'use client'

import { useFormState } from '@/hooks/use-form-state'
import { FormField, FormTextarea, FormSelect } from '@/components/ui/form-field'
import { FormButtons } from '@/components/ui/form-buttons'
import { useCreateEnvironmentLog, useUpdateEnvironmentLog } from '@/hooks/use-environment-logs'
import type { EnvironmentLog } from '@/generated/prisma/client'
import type { OfflineEnvironmentLog } from '@/lib/offline/db'

interface EnvironmentFormProps {
  reptileId: string
  log?: EnvironmentLog | OfflineEnvironmentLog | null
  onSuccess: () => void
  onCancel?: () => void
  compact?: boolean
}

interface EnvironmentFormValues extends Record<string, unknown> {
  date: string
  temperature: string
  humidity: string
  location: string
  notes: string
}

const locationOptions = [
  { value: 'hot_side', label: 'Hot Side' },
  { value: 'cool_side', label: 'Cool Side' },
  { value: 'ambient', label: 'Ambient' },
  { value: 'basking', label: 'Basking Spot' },
  { value: 'hide', label: 'Hide' },
  { value: 'water', label: 'Water' },
  { value: 'other', label: 'Other' },
]

function formatDateTime(date: Date | number | null | undefined): string {
  if (!date) {
    const now = new Date()
    return `${now.toISOString().split('T')[0]}T${now.toTimeString().slice(0, 5)}`
  }
  const d = new Date(date)
  return `${d.toISOString().split('T')[0]}T${d.toTimeString().slice(0, 5)}`
}

function getInitialValues(log?: EnvironmentLog | OfflineEnvironmentLog | null): EnvironmentFormValues {
  return {
    date: formatDateTime(log?.date),
    temperature: log?.temperature != null ? String(log.temperature) : '',
    humidity: log?.humidity != null ? String(log.humidity) : '',
    location: log?.location ?? '',
    notes: log?.notes ?? '',
  }
}

function validateEnvironmentForm(values: EnvironmentFormValues): Partial<Record<keyof EnvironmentFormValues, string>> {
  const errors: Partial<Record<keyof EnvironmentFormValues, string>> = {}
  if (!values.date) errors.date = 'Date and time is required'
  if (!values.temperature && !values.humidity) {
    errors.temperature = 'At least temperature or humidity is required'
  }
  if (values.temperature) {
    const temp = parseFloat(values.temperature)
    if (isNaN(temp)) errors.temperature = 'Temperature must be a number'
    else if (temp < 0 || temp > 150) errors.temperature = 'Temperature must be between 0 and 150'
  }
  if (values.humidity) {
    const humid = parseFloat(values.humidity)
    if (isNaN(humid)) errors.humidity = 'Humidity must be a number'
    else if (humid < 0 || humid > 100) errors.humidity = 'Humidity must be between 0% and 100%'
  }
  if (values.notes && values.notes.length > 500) errors.notes = 'Notes must be 500 characters or less'
  return errors
}

export function EnvironmentForm({ reptileId, log, onSuccess, onCancel, compact = false }: EnvironmentFormProps) {
  const isEditing = !!log
  const createLog = useCreateEnvironmentLog(reptileId)
  const updateLog = useUpdateEnvironmentLog(reptileId)
  const isPending = createLog.isPending || updateLog.isPending

  const { values, errors, handleChange, setFieldValue, handleSubmit, resetForm } = useFormState({
    initialValues: getInitialValues(log),
    validate: validateEnvironmentForm,
    onSubmit: async (formValues) => {
      const payload = {
        date: new Date(formValues.date),
        temperature: formValues.temperature ? parseFloat(formValues.temperature) : null,
        humidity: formValues.humidity ? parseFloat(formValues.humidity) : null,
        location: formValues.location || null,
        notes: formValues.notes.trim() || null,
      }

      if (isEditing && log) {
        await updateLog.mutateAsync({ logId: log.id, data: payload })
      } else {
        await createLog.mutateAsync(payload)
        if (compact) resetForm()
      }
      onSuccess()
    },
  })

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <FormField id="env-date" name="date" label="Date and Time" type="datetime-local" required
        value={values.date} onChange={handleChange} error={errors.date} />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField id="env-temperature" name="temperature" label="Temperature (F)" type="number"
          placeholder="e.g., 85" value={values.temperature} onChange={handleChange} error={errors.temperature}
          inputProps={{ min: '0', max: '150', step: '0.1' }} />
        <FormField id="env-humidity" name="humidity" label="Humidity (%)" type="number"
          placeholder="e.g., 60" value={values.humidity} onChange={handleChange} error={errors.humidity}
          inputProps={{ min: '0', max: '100', step: '1' }} />
      </div>

      <FormSelect id="env-location" label="Location" placeholder="Select location..." options={locationOptions}
        value={values.location} onValueChange={(v) => setFieldValue('location', v)} />

      <FormTextarea id="env-notes" name="notes" label="Notes" rows={2}
        placeholder="Additional notes..." value={values.notes} onChange={handleChange} error={errors.notes} />

      <FormButtons isSubmitting={isPending} onCancel={onCancel} compact={compact}
        submitLabel={isEditing ? 'Update Reading' : compact ? 'Log Reading' : 'Add Reading'}
        submittingLabel={compact ? 'Logging...' : 'Saving...'} />
    </form>
  )
}
