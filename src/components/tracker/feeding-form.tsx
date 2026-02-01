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
import { useCreateFeeding } from '@/hooks'
import { Loader2, Check } from 'lucide-react'

interface FeedingFormProps {
  reptileId: string
  onSuccess: () => void
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

export function FeedingForm({ reptileId, onSuccess }: FeedingFormProps) {
  const createFeeding = useCreateFeeding(reptileId)

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    preyType: '',
    preySize: '',
    preySource: 'FROZEN_THAWED' as 'FROZEN_THAWED' | 'LIVE' | 'PRE_KILLED',
    accepted: true,
    refused: false,
    regurgitated: false,
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
    if (!formData.date) newErrors.date = 'Date is required'
    if (!formData.preyType) newErrors.preyType = 'Prey type is required'
    if (!formData.preySize) newErrors.preySize = 'Prey size is required'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const resetForm = () => {
    setFormData({
      date: new Date().toISOString().split('T')[0],
      preyType: '',
      preySize: '',
      preySource: 'FROZEN_THAWED',
      accepted: true,
      refused: false,
      regurgitated: false,
      notes: '',
    })
    setErrors({})
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    try {
      await createFeeding.mutateAsync({
        date: new Date(formData.date),
        preyType: formData.preyType,
        preySize: formData.preySize,
        preySource: formData.preySource,
        accepted: formData.accepted,
        refused: formData.refused,
        regurgitated: formData.regurgitated,
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
          htmlFor="feeding-date"
          className="block text-sm font-medium text-warm-700 mb-1"
        >
          Date <span className="text-red-500">*</span>
        </label>
        <Input
          id="feeding-date"
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

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="preyType"
            className="block text-sm font-medium text-warm-700 mb-1"
          >
            Prey Type <span className="text-red-500">*</span>
          </label>
          <Select
            value={formData.preyType}
            onValueChange={(val) => handleSelectChange('preyType', val)}
          >
            <SelectTrigger aria-invalid={!!errors.preyType}>
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
            <p className="mt-1 text-sm text-red-500">{errors.preyType}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="preySize"
            className="block text-sm font-medium text-warm-700 mb-1"
          >
            Prey Size <span className="text-red-500">*</span>
          </label>
          <Select
            value={formData.preySize}
            onValueChange={(val) => handleSelectChange('preySize', val)}
          >
            <SelectTrigger aria-invalid={!!errors.preySize}>
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
            <p className="mt-1 text-sm text-red-500">{errors.preySize}</p>
          )}
        </div>
      </div>

      <div>
        <label
          htmlFor="preySource"
          className="block text-sm font-medium text-warm-700 mb-1"
        >
          Prey Source
        </label>
        <Select
          value={formData.preySource}
          onValueChange={(val) =>
            handleSelectChange(
              'preySource',
              val as 'FROZEN_THAWED' | 'LIVE' | 'PRE_KILLED'
            )
          }
        >
          <SelectTrigger>
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
            checked={formData.accepted}
            onChange={handleChange}
            className="h-4 w-4 rounded border-warm-300 text-primary focus:ring-primary"
          />
          <span className="text-sm text-warm-700">Accepted</span>
        </label>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            name="refused"
            checked={formData.refused}
            onChange={handleChange}
            className="h-4 w-4 rounded border-warm-300 text-primary focus:ring-primary"
          />
          <span className="text-sm text-warm-700">Refused</span>
        </label>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            name="regurgitated"
            checked={formData.regurgitated}
            onChange={handleChange}
            className="h-4 w-4 rounded border-warm-300 text-primary focus:ring-primary"
          />
          <span className="text-sm text-warm-700">Regurgitated</span>
        </label>
      </div>

      <div>
        <label
          htmlFor="feeding-notes"
          className="block text-sm font-medium text-warm-700 mb-1"
        >
          Notes
        </label>
        <textarea
          id="feeding-notes"
          name="notes"
          rows={3}
          placeholder="Additional notes..."
          value={formData.notes}
          onChange={handleChange}
          className="w-full rounded-md border border-warm-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      <Button
        type="submit"
        className="w-full"
        disabled={createFeeding.isPending}
      >
        {createFeeding.isPending ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Logging...
          </>
        ) : (
          <>
            <Check className="h-4 w-4 mr-2" />
            Log Feeding
          </>
        )}
      </Button>
    </form>
  )
}
