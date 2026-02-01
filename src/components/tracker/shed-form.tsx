'use client'

import { useState } from 'react'
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
import { Loader2, Check } from 'lucide-react'

interface ShedFormProps {
  reptileId: string
  onSuccess: () => void
}

const SHED_QUALITIES = [
  { value: 'COMPLETE', label: 'Complete - One piece' },
  { value: 'PARTIAL', label: 'Partial - Multiple pieces' },
  { value: 'PROBLEMATIC', label: 'Problematic - Stuck shed' },
]

export function ShedForm({ reptileId, onSuccess }: ShedFormProps) {
  const createShed = useCreateShed(reptileId)

  const [formData, setFormData] = useState({
    startDate: '',
    completedDate: new Date().toISOString().split('T')[0],
    quality: 'COMPLETE' as 'COMPLETE' | 'PARTIAL' | 'PROBLEMATIC',
    isComplete: true,
    issues: '',
    notes: '',
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target
    const newValue =
      type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    setFormData((prev) => ({ ...prev, [name]: newValue }))
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }))
    }
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }))
    }
  }

  const validate = () => {
    const newErrors: Record<string, string> = {}
    if (!formData.completedDate)
      newErrors.completedDate = 'Completed date is required'
    if (
      formData.startDate &&
      formData.completedDate &&
      new Date(formData.startDate) > new Date(formData.completedDate)
    ) {
      newErrors.startDate = 'Start date must be before completed date'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const resetForm = () => {
    setFormData({
      startDate: '',
      completedDate: new Date().toISOString().split('T')[0],
      quality: 'COMPLETE',
      isComplete: true,
      issues: '',
      notes: '',
    })
    setErrors({})
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    try {
      await createShed.mutateAsync({
        startDate: formData.startDate ? new Date(formData.startDate) : null,
        completedDate: new Date(formData.completedDate),
        quality: formData.quality,
        isComplete: formData.isComplete,
        issues: formData.issues || null,
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
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="startDate"
            className="block text-sm font-medium text-warm-700 mb-1"
          >
            Started (Blue Phase)
          </label>
          <Input
            id="startDate"
            name="startDate"
            type="date"
            value={formData.startDate}
            onChange={handleChange}
            aria-invalid={!!errors.startDate}
          />
          {errors.startDate && (
            <p className="mt-1 text-sm text-red-500">{errors.startDate}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="completedDate"
            className="block text-sm font-medium text-warm-700 mb-1"
          >
            Completed <span className="text-red-500">*</span>
          </label>
          <Input
            id="completedDate"
            name="completedDate"
            type="date"
            value={formData.completedDate}
            onChange={handleChange}
            aria-invalid={!!errors.completedDate}
          />
          {errors.completedDate && (
            <p className="mt-1 text-sm text-red-500">{errors.completedDate}</p>
          )}
        </div>
      </div>

      <div>
        <label
          htmlFor="quality"
          className="block text-sm font-medium text-warm-700 mb-1"
        >
          Shed Quality
        </label>
        <Select
          value={formData.quality}
          onValueChange={(val) =>
            handleSelectChange(
              'quality',
              val as 'COMPLETE' | 'PARTIAL' | 'PROBLEMATIC'
            )
          }
        >
          <SelectTrigger>
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
          checked={formData.isComplete}
          onChange={handleChange}
          className="h-4 w-4 rounded border-warm-300 text-primary focus:ring-primary"
        />
        <span className="text-sm text-warm-700">Shed is complete</span>
      </label>

      {formData.quality === 'PROBLEMATIC' && (
        <div>
          <label
            htmlFor="issues"
            className="block text-sm font-medium text-warm-700 mb-1"
          >
            Issues
          </label>
          <textarea
            id="issues"
            name="issues"
            rows={2}
            placeholder="Describe stuck shed areas, retained eye caps, etc..."
            value={formData.issues}
            onChange={handleChange}
            className="w-full rounded-md border border-warm-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      )}

      <div>
        <label
          htmlFor="shed-notes"
          className="block text-sm font-medium text-warm-700 mb-1"
        >
          Notes
        </label>
        <textarea
          id="shed-notes"
          name="notes"
          rows={3}
          placeholder="Additional observations..."
          value={formData.notes}
          onChange={handleChange}
          className="w-full rounded-md border border-warm-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      <Button type="submit" className="w-full" disabled={createShed.isPending}>
        {createShed.isPending ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Logging...
          </>
        ) : (
          <>
            <Check className="h-4 w-4 mr-2" />
            Log Shed
          </>
        )}
      </Button>
    </form>
  )
}
