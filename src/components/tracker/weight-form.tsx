'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useCreateWeight } from '@/hooks'
import { useFormState } from '@/hooks/use-form-state'
import { Loader2, Check } from 'lucide-react'

interface WeightFormProps {
  reptileId: string
  onSuccess: () => void
}

interface WeightFormValues {
  [key: string]: unknown
  date: string
  weight: string
  notes: string
}

const initialValues: WeightFormValues = {
  date: new Date().toISOString().split('T')[0],
  weight: '',
  notes: '',
}

export function WeightForm({ reptileId, onSuccess }: WeightFormProps) {
  const createWeight = useCreateWeight(reptileId)

  const { values, errors, handleChange, handleSubmit, resetForm } =
    useFormState<WeightFormValues>({
      initialValues,
      validate: (values) => {
        const errors: Partial<Record<keyof WeightFormValues, string>> = {}
        if (!values.date) errors.date = 'Date is required'
        if (!values.weight) {
          errors.weight = 'Weight is required'
        } else if (isNaN(parseFloat(values.weight))) {
          errors.weight = 'Weight must be a number'
        } else if (parseFloat(values.weight) <= 0) {
          errors.weight = 'Weight must be positive'
        }
        return errors
      },
      onSubmit: async (values) => {
        await createWeight.mutateAsync({
          date: new Date(values.date),
          weight: parseFloat(values.weight),
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
          htmlFor="weight-date"
          className="block text-sm font-medium text-warm-700 mb-1"
        >
          Date <span className="text-red-500">*</span>
        </label>
        <Input
          id="weight-date"
          name="date"
          type="date"
          value={values.date}
          onChange={handleChange}
          aria-invalid={!!errors.date}
          aria-describedby={errors.date ? 'weight-date-error' : undefined}
        />
        {errors.date && (
          <p id="weight-date-error" className="mt-1 text-sm text-red-500" role="alert">
            {errors.date}
          </p>
        )}
      </div>

      <div>
        <label
          htmlFor="weight"
          className="block text-sm font-medium text-warm-700 mb-1"
        >
          Weight (grams) <span className="text-red-500">*</span>
        </label>
        <Input
          id="weight"
          name="weight"
          type="number"
          step="0.1"
          min="0"
          placeholder="e.g., 150.5"
          value={values.weight}
          onChange={handleChange}
          aria-invalid={!!errors.weight}
          aria-describedby={errors.weight ? 'weight-error' : undefined}
        />
        {errors.weight && (
          <p id="weight-error" className="mt-1 text-sm text-red-500" role="alert">
            {errors.weight}
          </p>
        )}
      </div>

      <div>
        <label
          htmlFor="weight-notes"
          className="block text-sm font-medium text-warm-700 mb-1"
        >
          Notes
        </label>
        <textarea
          id="weight-notes"
          name="notes"
          rows={3}
          placeholder="Any observations about body condition..."
          value={values.notes}
          onChange={handleChange}
          className="w-full rounded-md border border-warm-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      <Button
        type="submit"
        className="w-full"
        disabled={createWeight.isPending}
      >
        {createWeight.isPending ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" aria-hidden="true" />
            Logging...
          </>
        ) : (
          <>
            <Check className="h-4 w-4 mr-2" aria-hidden="true" />
            Log Weight
          </>
        )}
      </Button>
    </form>
  )
}
