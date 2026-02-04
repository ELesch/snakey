'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useCreateShed } from '@/hooks'
import { useFormState } from '@/hooks/use-form-state'
import { Loader2, Check } from 'lucide-react'

interface ShedFormProps {
  reptileId: string
  onSuccess: () => void
}

interface ShedFormValues {
  [key: string]: unknown
  startDate: string
  completedDate: string
  quality: 'COMPLETE' | 'PARTIAL' | 'PROBLEMATIC'
  isComplete: boolean
  issues: string
  notes: string
}

const SHED_QUALITIES = [
  { value: 'COMPLETE', label: 'Complete - One piece' },
  { value: 'PARTIAL', label: 'Partial - Multiple pieces' },
  { value: 'PROBLEMATIC', label: 'Problematic - Stuck shed' },
]

const initialValues: ShedFormValues = {
  startDate: '',
  completedDate: new Date().toISOString().split('T')[0],
  quality: 'COMPLETE',
  isComplete: true,
  issues: '',
  notes: '',
}

export function ShedForm({ reptileId, onSuccess }: ShedFormProps) {
  const createShed = useCreateShed(reptileId)

  const { values, errors, handleChange, handleSubmit, resetForm, setFieldValue } =
    useFormState<ShedFormValues>({
      initialValues,
      validate: (values) => {
        const errors: Partial<Record<keyof ShedFormValues, string>> = {}
        if (!values.completedDate)
          errors.completedDate = 'Completed date is required'
        if (
          values.startDate &&
          values.completedDate &&
          new Date(values.startDate) > new Date(values.completedDate)
        ) {
          errors.startDate = 'Start date must be before completed date'
        }
        return errors
      },
      onSubmit: async (values) => {
        await createShed.mutateAsync({
          startDate: values.startDate ? new Date(values.startDate) : null,
          completedDate: new Date(values.completedDate),
          quality: values.quality,
          isComplete: values.isComplete,
          issues: values.issues || null,
          notes: values.notes || null,
        })
        resetForm()
        onSuccess()
      },
    })

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="startDate"
            className="block text-sm font-medium text-warm-800 mb-1"
          >
            Started (Blue Phase)
          </label>
          <Input
            id="startDate"
            name="startDate"
            type="date"
            value={values.startDate}
            onChange={handleChange}
            aria-invalid={!!errors.startDate}
            aria-describedby={errors.startDate ? 'startDate-error' : undefined}
          />
          {errors.startDate && (
            <p id="startDate-error" className="mt-1 text-sm text-red-500" role="alert">
              {errors.startDate}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="completedDate"
            className="block text-sm font-medium text-warm-800 mb-1"
          >
            Completed <span className="text-red-500">*</span>
          </label>
          <Input
            id="completedDate"
            name="completedDate"
            type="date"
            value={values.completedDate}
            onChange={handleChange}
            aria-invalid={!!errors.completedDate}
            aria-describedby={errors.completedDate ? 'completedDate-error' : undefined}
          />
          {errors.completedDate && (
            <p id="completedDate-error" className="mt-1 text-sm text-red-500" role="alert">
              {errors.completedDate}
            </p>
          )}
        </div>
      </div>

      <div>
        <label
          htmlFor="quality"
          className="block text-sm font-medium text-warm-800 mb-1"
        >
          Shed Quality
        </label>
        <Select
          value={values.quality}
          onValueChange={(val) =>
            setFieldValue('quality', val as 'COMPLETE' | 'PARTIAL' | 'PROBLEMATIC')
          }
        >
          <SelectTrigger id="quality">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SHED_QUALITIES.map((quality) => (
              <SelectItem key={quality.value} value={quality.value}>
                {quality.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          name="isComplete"
          checked={values.isComplete}
          onChange={handleChange}
          className="h-4 w-4 rounded border-warm-300 text-primary focus:ring-primary"
        />
        <span className="text-sm text-warm-800">Shed is complete</span>
      </label>

      {values.quality === 'PROBLEMATIC' && (
        <div>
          <label
            htmlFor="issues"
            className="block text-sm font-medium text-warm-800 mb-1"
          >
            Issues
          </label>
          <textarea
            id="issues"
            name="issues"
            rows={2}
            placeholder="Describe stuck shed areas, retained eye caps, etc..."
            value={values.issues}
            onChange={handleChange}
            className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm text-[var(--color-foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] focus-visible:ring-offset-2"
          />
        </div>
      )}

      <div>
        <label
          htmlFor="shed-notes"
          className="block text-sm font-medium text-warm-800 mb-1"
        >
          Notes
        </label>
        <textarea
          id="shed-notes"
          name="notes"
          rows={3}
          placeholder="Additional observations..."
          value={values.notes}
          onChange={handleChange}
          className="w-full rounded-md border border-warm-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] focus-visible:ring-offset-2"
        />
      </div>

      <Button type="submit" className="w-full" disabled={createShed.isPending}>
        {createShed.isPending ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" aria-hidden="true" />
            Logging...
          </>
        ) : (
          <>
            <Check className="h-4 w-4 mr-2" aria-hidden="true" />
            Log Shed
          </>
        )}
      </Button>
    </form>
  )
}
