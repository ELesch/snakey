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
import { useCreateFeeding } from '@/hooks'
import { useFormState } from '@/hooks/use-form-state'
import { Loader2, Check } from 'lucide-react'

interface FeedingFormProps {
  reptileId: string
  onSuccess: () => void
}

interface FeedingFormValues {
  [key: string]: unknown
  date: string
  preyType: string
  preySize: string
  preySource: 'FROZEN_THAWED' | 'LIVE' | 'PRE_KILLED'
  accepted: boolean
  refused: boolean
  regurgitated: boolean
  notes: string
}

const PREY_TYPES = [
  'Mouse',
  'Rat',
  'Chick',
  'Quail',
  'Rabbit',
  'Guinea Pig',
  'Insects',
  'Fish',
  'Other',
]

const PREY_SIZES = [
  'Pinky',
  'Fuzzy',
  'Hopper',
  'Weaning',
  'Adult',
  'Small',
  'Medium',
  'Large',
  'Extra Large',
]

const PREY_SOURCES = [
  { value: 'FROZEN_THAWED', label: 'Frozen/Thawed' },
  { value: 'LIVE', label: 'Live' },
  { value: 'PRE_KILLED', label: 'Pre-killed' },
]

const initialValues: FeedingFormValues = {
  date: new Date().toISOString().split('T')[0],
  preyType: '',
  preySize: '',
  preySource: 'FROZEN_THAWED',
  accepted: true,
  refused: false,
  regurgitated: false,
  notes: '',
}

export function FeedingForm({ reptileId, onSuccess }: FeedingFormProps) {
  const createFeeding = useCreateFeeding(reptileId)

  const { values, errors, handleChange, handleSubmit, resetForm, setFieldValue } =
    useFormState<FeedingFormValues>({
      initialValues,
      validate: (values) => {
        const errors: Partial<Record<keyof FeedingFormValues, string>> = {}
        if (!values.date) errors.date = 'Date is required'
        if (!values.preyType) errors.preyType = 'Prey type is required'
        if (!values.preySize) errors.preySize = 'Prey size is required'
        return errors
      },
      onSubmit: async (values) => {
        await createFeeding.mutateAsync({
          date: new Date(values.date),
          preyType: values.preyType,
          preySize: values.preySize,
          preySource: values.preySource,
          accepted: values.accepted,
          refused: values.refused,
          regurgitated: values.regurgitated,
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
          htmlFor="feeding-date"
          className="block text-sm font-medium text-warm-800 mb-1"
        >
          Date <span className="text-red-500">*</span>
        </label>
        <Input
          id="feeding-date"
          name="date"
          type="date"
          value={values.date}
          onChange={handleChange}
          aria-invalid={!!errors.date}
          aria-describedby={errors.date ? 'feeding-date-error' : undefined}
        />
        {errors.date && (
          <p id="feeding-date-error" className="mt-1 text-sm text-red-500" role="alert">
            {errors.date}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="preyType"
            className="block text-sm font-medium text-warm-800 mb-1"
          >
            Prey Type <span className="text-red-500">*</span>
          </label>
          <Select
            value={values.preyType}
            onValueChange={(val) => setFieldValue('preyType', val)}
          >
            <SelectTrigger
              id="preyType"
              aria-invalid={!!errors.preyType}
              aria-describedby={errors.preyType ? 'preyType-error' : undefined}
            >
              <SelectValue placeholder="Select prey type" />
            </SelectTrigger>
            <SelectContent>
              {PREY_TYPES.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.preyType && (
            <p id="preyType-error" className="mt-1 text-sm text-red-500" role="alert">
              {errors.preyType}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="preySize"
            className="block text-sm font-medium text-warm-800 mb-1"
          >
            Prey Size <span className="text-red-500">*</span>
          </label>
          <Select
            value={values.preySize}
            onValueChange={(val) => setFieldValue('preySize', val)}
          >
            <SelectTrigger
              id="preySize"
              aria-invalid={!!errors.preySize}
              aria-describedby={errors.preySize ? 'preySize-error' : undefined}
            >
              <SelectValue placeholder="Select size" />
            </SelectTrigger>
            <SelectContent>
              {PREY_SIZES.map((size) => (
                <SelectItem key={size} value={size}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.preySize && (
            <p id="preySize-error" className="mt-1 text-sm text-red-500" role="alert">
              {errors.preySize}
            </p>
          )}
        </div>
      </div>

      <div>
        <label
          htmlFor="preySource"
          className="block text-sm font-medium text-warm-800 mb-1"
        >
          Prey Source
        </label>
        <Select
          value={values.preySource}
          onValueChange={(val) =>
            setFieldValue('preySource', val as 'FROZEN_THAWED' | 'LIVE' | 'PRE_KILLED')
          }
        >
          <SelectTrigger id="preySource">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PREY_SOURCES.map((source) => (
              <SelectItem key={source.value} value={source.value}>
                {source.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-wrap gap-4">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            name="accepted"
            checked={values.accepted}
            onChange={handleChange}
            className="h-4 w-4 rounded border-warm-300 text-primary focus:ring-primary"
          />
          <span className="text-sm text-warm-800">Accepted</span>
        </label>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            name="refused"
            checked={values.refused}
            onChange={handleChange}
            className="h-4 w-4 rounded border-warm-300 text-primary focus:ring-primary"
          />
          <span className="text-sm text-warm-800">Refused</span>
        </label>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            name="regurgitated"
            checked={values.regurgitated}
            onChange={handleChange}
            className="h-4 w-4 rounded border-warm-300 text-primary focus:ring-primary"
          />
          <span className="text-sm text-warm-800">Regurgitated</span>
        </label>
      </div>

      <div>
        <label
          htmlFor="feeding-notes"
          className="block text-sm font-medium text-warm-800 mb-1"
        >
          Notes
        </label>
        <textarea
          id="feeding-notes"
          name="notes"
          rows={3}
          placeholder="Additional notes..."
          value={values.notes}
          onChange={handleChange}
          className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm text-[var(--color-foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] focus-visible:ring-offset-2"
        />
      </div>

      <Button
        type="submit"
        className="w-full"
        disabled={createFeeding.isPending}
      >
        {createFeeding.isPending ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" aria-hidden="true" />
            Logging...
          </>
        ) : (
          <>
            <Check className="h-4 w-4 mr-2" aria-hidden="true" />
            Log Feeding
          </>
        )}
      </Button>
    </form>
  )
}
