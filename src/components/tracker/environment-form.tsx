'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useCreateEnvironmentLog } from '@/hooks'
import { useFormState } from '@/hooks/use-form-state'
import { Loader2, Check } from 'lucide-react'

interface EnvironmentFormProps {
  reptileId: string
  onSuccess: () => void
}

interface EnvironmentFormValues {
  [key: string]: unknown
  date: string
  temperature: string
  humidity: string
  location: string
  notes: string
}

const LOCATIONS = [
  { value: 'hot_side', label: 'Hot Side' },
  { value: 'cool_side', label: 'Cool Side' },
  { value: 'ambient', label: 'Ambient' },
  { value: 'basking', label: 'Basking Spot' },
  { value: 'hide', label: 'Hide' },
  { value: 'water', label: 'Water' },
  { value: 'other', label: 'Other' },
]

const initialValues: EnvironmentFormValues = {
  date: new Date().toISOString().split('T')[0],
  temperature: '',
  humidity: '',
  location: '',
  notes: '',
}

export function EnvironmentForm({ reptileId, onSuccess }: EnvironmentFormProps) {
  const createLog = useCreateEnvironmentLog(reptileId)

  const { values, errors, handleChange, handleSubmit, resetForm, setFieldValue } =
    useFormState<EnvironmentFormValues>({
      initialValues,
      validate: (values) => {
        const errors: Partial<Record<keyof EnvironmentFormValues, string>> = {}
        if (!values.date) errors.date = 'Date is required'
        if (!values.temperature && !values.humidity) {
          errors.temperature = 'At least temperature or humidity is required'
        }
        if (values.temperature) {
          const temp = parseFloat(values.temperature)
          if (isNaN(temp)) {
            errors.temperature = 'Temperature must be a number'
          } else if (temp < 0 || temp > 150) {
            errors.temperature = 'Temperature must be between 0 and 150'
          }
        }
        if (values.humidity) {
          const humid = parseFloat(values.humidity)
          if (isNaN(humid)) {
            errors.humidity = 'Humidity must be a number'
          } else if (humid < 0 || humid > 100) {
            errors.humidity = 'Humidity must be between 0% and 100%'
          }
        }
        return errors
      },
      onSubmit: async (values) => {
        await createLog.mutateAsync({
          date: new Date(values.date),
          temperature: values.temperature
            ? parseFloat(values.temperature)
            : null,
          humidity: values.humidity ? parseFloat(values.humidity) : null,
          location: values.location || null,
          notes: values.notes || null,
        })
        resetForm()
        onSuccess()
      },
    })

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label
          htmlFor="env-date"
          className="block text-sm font-medium text-warm-700 dark:text-warm-300 mb-1"
        >
          Date <span className="text-red-500">*</span>
        </label>
        <Input
          id="env-date"
          name="date"
          type="date"
          value={values.date}
          onChange={handleChange}
          aria-invalid={!!errors.date}
          aria-describedby={errors.date ? 'env-date-error' : undefined}
        />
        {errors.date && (
          <p id="env-date-error" className="mt-1 text-sm text-red-500" role="alert">
            {errors.date}
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="temperature"
            className="block text-sm font-medium text-warm-700 dark:text-warm-300 mb-1"
          >
            Temperature (F)
          </label>
          <Input
            id="temperature"
            name="temperature"
            type="number"
            step="0.1"
            placeholder="e.g., 85"
            value={values.temperature}
            onChange={handleChange}
            aria-invalid={!!errors.temperature}
            aria-describedby={errors.temperature ? 'temperature-error' : undefined}
          />
          {errors.temperature && (
            <p id="temperature-error" className="mt-1 text-sm text-red-500" role="alert">
              {errors.temperature}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="humidity"
            className="block text-sm font-medium text-warm-700 dark:text-warm-300 mb-1"
          >
            Humidity (%)
          </label>
          <Input
            id="humidity"
            name="humidity"
            type="number"
            step="1"
            min="0"
            max="100"
            placeholder="e.g., 60"
            value={values.humidity}
            onChange={handleChange}
            aria-invalid={!!errors.humidity}
            aria-describedby={errors.humidity ? 'humidity-error' : undefined}
          />
          {errors.humidity && (
            <p id="humidity-error" className="mt-1 text-sm text-red-500" role="alert">
              {errors.humidity}
            </p>
          )}
        </div>
      </div>

      <div>
        <label
          htmlFor="location"
          className="block text-sm font-medium text-warm-700 dark:text-warm-300 mb-1"
        >
          Location
        </label>
        <Select
          value={values.location}
          onValueChange={(val) => setFieldValue('location', val)}
        >
          <SelectTrigger id="location">
            <SelectValue placeholder="Select location" />
          </SelectTrigger>
          <SelectContent>
            {LOCATIONS.map((loc) => (
              <SelectItem key={loc.value} value={loc.value}>
                {loc.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <label
          htmlFor="env-notes"
          className="block text-sm font-medium text-warm-700 dark:text-warm-300 mb-1"
        >
          Notes
        </label>
        <Textarea
          id="env-notes"
          name="notes"
          rows={3}
          placeholder="Any environmental observations..."
          value={values.notes}
          onChange={handleChange}
        />
      </div>

      <Button type="submit" className="w-full" disabled={createLog.isPending}>
        {createLog.isPending ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" aria-hidden="true" />
            Logging...
          </>
        ) : (
          <>
            <Check className="h-4 w-4 mr-2" aria-hidden="true" />
            Log Environment
          </>
        )}
      </Button>
    </form>
  )
}
