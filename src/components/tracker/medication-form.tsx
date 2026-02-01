'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useCreateMedication } from '@/hooks'
import { Loader2, Check } from 'lucide-react'

interface MedicationFormProps {
  reptileId: string
  onSuccess: () => void
}

export function MedicationForm({ reptileId, onSuccess }: MedicationFormProps) {
  const createMedication = useCreateMedication(reptileId)

  const [formData, setFormData] = useState({
    name: '',
    dosage: '',
    frequency: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    notes: '',
    reminders: false,
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

  const validate = () => {
    const newErrors: Record<string, string> = {}
    if (!formData.name.trim()) newErrors.name = 'Medication name is required'
    if (formData.name.length > 200)
      newErrors.name = 'Name must be 200 characters or less'
    if (!formData.dosage.trim()) newErrors.dosage = 'Dosage is required'
    if (formData.dosage.length > 100)
      newErrors.dosage = 'Dosage must be 100 characters or less'
    if (!formData.frequency.trim())
      newErrors.frequency = 'Frequency is required'
    if (formData.frequency.length > 100)
      newErrors.frequency = 'Frequency must be 100 characters or less'
    if (!formData.startDate) newErrors.startDate = 'Start date is required'
    if (
      formData.endDate &&
      formData.startDate &&
      new Date(formData.endDate) < new Date(formData.startDate)
    ) {
      newErrors.endDate = 'End date must be after start date'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const resetForm = () => {
    setFormData({
      name: '',
      dosage: '',
      frequency: '',
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
      notes: '',
      reminders: false,
    })
    setErrors({})
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    try {
      await createMedication.mutateAsync({
        name: formData.name.trim(),
        dosage: formData.dosage.trim(),
        frequency: formData.frequency.trim(),
        startDate: new Date(formData.startDate),
        endDate: formData.endDate ? new Date(formData.endDate) : null,
        notes: formData.notes.trim() || null,
        reminders: formData.reminders,
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
          htmlFor="med-name"
          className="block text-sm font-medium text-warm-700 mb-1"
        >
          Medication Name <span className="text-red-500">*</span>
        </label>
        <Input
          id="med-name"
          name="name"
          placeholder="e.g., Metronidazole"
          value={formData.name}
          onChange={handleChange}
          aria-invalid={!!errors.name}
        />
        {errors.name && (
          <p className="mt-1 text-sm text-red-500">{errors.name}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="dosage"
            className="block text-sm font-medium text-warm-700 mb-1"
          >
            Dosage <span className="text-red-500">*</span>
          </label>
          <Input
            id="dosage"
            name="dosage"
            placeholder="e.g., 25mg"
            value={formData.dosage}
            onChange={handleChange}
            aria-invalid={!!errors.dosage}
          />
          {errors.dosage && (
            <p className="mt-1 text-sm text-red-500">{errors.dosage}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="frequency"
            className="block text-sm font-medium text-warm-700 mb-1"
          >
            Frequency <span className="text-red-500">*</span>
          </label>
          <Input
            id="frequency"
            name="frequency"
            placeholder="e.g., Once daily"
            value={formData.frequency}
            onChange={handleChange}
            aria-invalid={!!errors.frequency}
          />
          {errors.frequency && (
            <p className="mt-1 text-sm text-red-500">{errors.frequency}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="med-startDate"
            className="block text-sm font-medium text-warm-700 mb-1"
          >
            Start Date <span className="text-red-500">*</span>
          </label>
          <Input
            id="med-startDate"
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
            htmlFor="med-endDate"
            className="block text-sm font-medium text-warm-700 mb-1"
          >
            End Date
          </label>
          <Input
            id="med-endDate"
            name="endDate"
            type="date"
            value={formData.endDate}
            onChange={handleChange}
            aria-invalid={!!errors.endDate}
          />
          {errors.endDate && (
            <p className="mt-1 text-sm text-red-500">{errors.endDate}</p>
          )}
        </div>
      </div>

      <div>
        <label
          htmlFor="med-notes"
          className="block text-sm font-medium text-warm-700 mb-1"
        >
          Notes
        </label>
        <textarea
          id="med-notes"
          name="notes"
          rows={3}
          placeholder="Additional notes about this medication..."
          value={formData.notes}
          onChange={handleChange}
          className="w-full rounded-md border border-warm-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          name="reminders"
          checked={formData.reminders}
          onChange={handleChange}
          className="h-4 w-4 rounded border-warm-300 text-primary focus:ring-primary"
        />
        <span className="text-sm text-warm-700">
          Enable reminders for this medication
        </span>
      </label>

      <Button
        type="submit"
        className="w-full"
        disabled={createMedication.isPending}
      >
        {createMedication.isPending ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Adding...
          </>
        ) : (
          <>
            <Check className="h-4 w-4 mr-2" />
            Add Medication
          </>
        )}
      </Button>
    </form>
  )
}
