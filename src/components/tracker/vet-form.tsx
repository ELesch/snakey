'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useCreateVetVisit } from '@/hooks'
import { Loader2, Check } from 'lucide-react'

interface VetFormProps {
  reptileId: string
  onSuccess: () => void
}

export function VetForm({ reptileId, onSuccess }: VetFormProps) {
  const createVisit = useCreateVetVisit(reptileId)

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    reason: '',
    diagnosis: '',
    treatment: '',
    vetName: '',
    vetClinic: '',
    cost: '',
    followUp: '',
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
    if (!formData.reason.trim()) newErrors.reason = 'Reason is required'
    if (formData.reason.length > 500)
      newErrors.reason = 'Reason must be 500 characters or less'
    if (formData.cost && isNaN(parseFloat(formData.cost)))
      newErrors.cost = 'Cost must be a number'
    if (formData.cost && parseFloat(formData.cost) < 0)
      newErrors.cost = 'Cost must be non-negative'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const resetForm = () => {
    setFormData({
      date: new Date().toISOString().split('T')[0],
      reason: '',
      diagnosis: '',
      treatment: '',
      vetName: '',
      vetClinic: '',
      cost: '',
      followUp: '',
      notes: '',
    })
    setErrors({})
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    try {
      await createVisit.mutateAsync({
        date: new Date(formData.date),
        reason: formData.reason.trim(),
        diagnosis: formData.diagnosis.trim() || null,
        treatment: formData.treatment.trim() || null,
        vetName: formData.vetName.trim() || null,
        vetClinic: formData.vetClinic.trim() || null,
        cost: formData.cost ? parseFloat(formData.cost) : null,
        followUp: formData.followUp ? new Date(formData.followUp) : null,
        notes: formData.notes.trim() || null,
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
            htmlFor="vet-date"
            className="block text-sm font-medium text-warm-700 mb-1"
          >
            Date <span className="text-red-500">*</span>
          </label>
          <Input
            id="vet-date"
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
            htmlFor="cost"
            className="block text-sm font-medium text-warm-700 mb-1"
          >
            Cost ($)
          </label>
          <Input
            id="cost"
            name="cost"
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            value={formData.cost}
            onChange={handleChange}
            aria-invalid={!!errors.cost}
          />
          {errors.cost && (
            <p className="mt-1 text-sm text-red-500">{errors.cost}</p>
          )}
        </div>
      </div>

      <div>
        <label
          htmlFor="reason"
          className="block text-sm font-medium text-warm-700 mb-1"
        >
          Reason for Visit <span className="text-red-500">*</span>
        </label>
        <Input
          id="reason"
          name="reason"
          placeholder="e.g., Annual checkup, respiratory issue"
          value={formData.reason}
          onChange={handleChange}
          aria-invalid={!!errors.reason}
        />
        {errors.reason && (
          <p className="mt-1 text-sm text-red-500">{errors.reason}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="vetName"
            className="block text-sm font-medium text-warm-700 mb-1"
          >
            Veterinarian Name
          </label>
          <Input
            id="vetName"
            name="vetName"
            placeholder="Dr. Smith"
            value={formData.vetName}
            onChange={handleChange}
          />
        </div>

        <div>
          <label
            htmlFor="vetClinic"
            className="block text-sm font-medium text-warm-700 mb-1"
          >
            Clinic
          </label>
          <Input
            id="vetClinic"
            name="vetClinic"
            placeholder="Exotic Pet Clinic"
            value={formData.vetClinic}
            onChange={handleChange}
          />
        </div>
      </div>

      <div>
        <label
          htmlFor="diagnosis"
          className="block text-sm font-medium text-warm-700 mb-1"
        >
          Diagnosis
        </label>
        <textarea
          id="diagnosis"
          name="diagnosis"
          rows={2}
          placeholder="What was diagnosed..."
          value={formData.diagnosis}
          onChange={handleChange}
          className="w-full rounded-md border border-warm-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      <div>
        <label
          htmlFor="treatment"
          className="block text-sm font-medium text-warm-700 mb-1"
        >
          Treatment
        </label>
        <textarea
          id="treatment"
          name="treatment"
          rows={2}
          placeholder="Treatment prescribed..."
          value={formData.treatment}
          onChange={handleChange}
          className="w-full rounded-md border border-warm-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      <div>
        <label
          htmlFor="followUp"
          className="block text-sm font-medium text-warm-700 mb-1"
        >
          Follow-up Date
        </label>
        <Input
          id="followUp"
          name="followUp"
          type="date"
          value={formData.followUp}
          onChange={handleChange}
        />
      </div>

      <div>
        <label
          htmlFor="vet-notes"
          className="block text-sm font-medium text-warm-700 mb-1"
        >
          Notes
        </label>
        <textarea
          id="vet-notes"
          name="notes"
          rows={2}
          placeholder="Additional notes..."
          value={formData.notes}
          onChange={handleChange}
          className="w-full rounded-md border border-warm-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      <Button
        type="submit"
        className="w-full"
        disabled={createVisit.isPending}
      >
        {createVisit.isPending ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Logging...
          </>
        ) : (
          <>
            <Check className="h-4 w-4 mr-2" />
            Log Vet Visit
          </>
        )}
      </Button>
    </form>
  )
}
