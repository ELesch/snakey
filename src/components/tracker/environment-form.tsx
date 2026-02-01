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
import { useCreateEnvironmentLog } from '@/hooks'
import { Loader2, Check } from 'lucide-react'

interface EnvironmentFormProps {
  reptileId: string
  onSuccess: () => void
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

export function EnvironmentForm({ reptileId, onSuccess }: EnvironmentFormProps) {
  const createLog = useCreateEnvironmentLog(reptileId)

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    temperature: '',
    humidity: '',
    location: '',
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

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }))
    }
  }

  const validate = () => {
    const newErrors: Record<string, string> = {}
    if (!formData.date) newErrors.date = 'Date is required'
    if (!formData.temperature && !formData.humidity) {
      newErrors.temperature = 'At least temperature or humidity is required'
    }
    if (formData.temperature) {
      const temp = parseFloat(formData.temperature)
      if (isNaN(temp)) {
        newErrors.temperature = 'Temperature must be a number'
      } else if (temp < 0 || temp > 150) {
        newErrors.temperature = 'Temperature must be between 0 and 150'
      }
    }
    if (formData.humidity) {
      const humid = parseFloat(formData.humidity)
      if (isNaN(humid)) {
        newErrors.humidity = 'Humidity must be a number'
      } else if (humid < 0 || humid > 100) {
        newErrors.humidity = 'Humidity must be between 0% and 100%'
      }
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const resetForm = () => {
    setFormData({
      date: new Date().toISOString().split('T')[0],
      temperature: '',
      humidity: '',
      location: '',
      notes: '',
    })
    setErrors({})
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    try {
      await createLog.mutateAsync({
        date: new Date(formData.date),
        temperature: formData.temperature
          ? parseFloat(formData.temperature)
          : null,
        humidity: formData.humidity ? parseFloat(formData.humidity) : null,
        location: formData.location || null,
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
          htmlFor="env-date"
          className="block text-sm font-medium text-warm-700 mb-1"
        >
          Date <span className="text-red-500">*</span>
        </label>
        <Input
          id="env-date"
          name="date"
          type="date"
          value={formData.date}
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
            className="block text-sm font-medium text-warm-700 mb-1"
          >
            Temperature (F)
          </label>
          <Input
            id="temperature"
            name="temperature"
            type="number"
            step="0.1"
            placeholder="e.g., 85"
            value={formData.temperature}
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
            className="block text-sm font-medium text-warm-700 mb-1"
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
            value={formData.humidity}
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
          className="block text-sm font-medium text-warm-700 mb-1"
        >
          Location
        </label>
        <Select
          value={formData.location}
          onValueChange={(val) => handleSelectChange('location', val)}
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
          className="block text-sm font-medium text-warm-700 mb-1"
        >
          Notes
        </label>
        <textarea
          id="env-notes"
          name="notes"
          rows={3}
          placeholder="Any environmental observations..."
          value={formData.notes}
          onChange={handleChange}
          className="w-full rounded-md border border-warm-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
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
