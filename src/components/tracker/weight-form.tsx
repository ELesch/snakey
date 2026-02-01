'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useCreateWeight } from '@/hooks'
import { Loader2, Check } from 'lucide-react'

interface WeightFormProps {
  reptileId: string
  onSuccess: () => void
}

export function WeightForm({ reptileId, onSuccess }: WeightFormProps) {
  const createWeight = useCreateWeight(reptileId)

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    weight: '',
    notes: '',
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }))
    }
  }

  const validate = () => {
    const newErrors: Record<string, string> = {}
    if (!formData.date) newErrors.date = 'Date is required'
    if (!formData.weight) {
      newErrors.weight = 'Weight is required'
    } else if (isNaN(parseFloat(formData.weight))) {
      newErrors.weight = 'Weight must be a number'
    } else if (parseFloat(formData.weight) <= 0) {
      newErrors.weight = 'Weight must be positive'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const resetForm = () => {
    setFormData({
      date: new Date().toISOString().split('T')[0],
      weight: '',
      notes: '',
    })
    setErrors({})
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    try {
      await createWeight.mutateAsync({
        date: new Date(formData.date),
        weight: parseFloat(formData.weight),
        notes: formData.notes || null,
      })
      resetForm()
      onSuccess()
    } catch {
      // Error handling done by mutation
    }
  }

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
          value={formData.date}
          onChange={handleChange}
          aria-invalid={!!errors.date}
        />
        {errors.date && (
          <p className="mt-1 text-sm text-red-500">{errors.date}</p>
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
          value={formData.weight}
          onChange={handleChange}
          aria-invalid={!!errors.weight}
        />
        {errors.weight && (
          <p className="mt-1 text-sm text-red-500">{errors.weight}</p>
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
          value={formData.notes}
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
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Logging...
          </>
        ) : (
          <>
            <Check className="h-4 w-4 mr-2" />
            Log Weight
          </>
        )}
      </Button>
    </form>
  )
}
