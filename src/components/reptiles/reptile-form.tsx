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
import { getSpeciesOptions } from '@/lib/species/defaults'

interface ReptileFormProps {
  onSuccess?: () => void
  initialData?: {
    name: string
    species: string
    morph?: string
    sex?: string
    birthDate?: string
    acquisitionDate?: string
    breeder?: string
    notes?: string
  }
}

export function ReptileForm({ onSuccess, initialData }: ReptileFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    species: initialData?.species || '',
    morph: initialData?.morph || '',
    sex: initialData?.sex || '',
    birthDate: initialData?.birthDate || '',
    acquisitionDate: initialData?.acquisitionDate || '',
    breeder: initialData?.breeder || '',
    notes: initialData?.notes || '',
  })

  const speciesOptions = getSpeciesOptions()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // TODO: Save to API and/or offline DB
      console.log('Saving reptile:', formData)
      onSuccess?.()
    } catch (error) {
      console.error('Failed to save reptile:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium mb-1">
          Name <span className="text-red-500">*</span>
        </label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Enter reptile name"
          required
        />
      </div>

      <div>
        <label htmlFor="species" className="block text-sm font-medium mb-1">
          Species <span className="text-red-500">*</span>
        </label>
        <Select
          value={formData.species}
          onValueChange={(value) => setFormData({ ...formData, species: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select species" />
          </SelectTrigger>
          <SelectContent>
            {speciesOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <label htmlFor="morph" className="block text-sm font-medium mb-1">
          Morph / Locale
        </label>
        <Input
          id="morph"
          value={formData.morph}
          onChange={(e) => setFormData({ ...formData, morph: e.target.value })}
          placeholder="e.g., Banana, Pastel, Albino"
        />
      </div>

      <div>
        <label htmlFor="sex" className="block text-sm font-medium mb-1">
          Sex
        </label>
        <Select
          value={formData.sex}
          onValueChange={(value) => setFormData({ ...formData, sex: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select sex" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="male">Male</SelectItem>
            <SelectItem value="female">Female</SelectItem>
            <SelectItem value="unknown">Unknown</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="birthDate" className="block text-sm font-medium mb-1">
            Birth/Hatch Date
          </label>
          <Input
            id="birthDate"
            type="date"
            value={formData.birthDate}
            onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
          />
        </div>

        <div>
          <label htmlFor="acquisitionDate" className="block text-sm font-medium mb-1">
            Acquisition Date
          </label>
          <Input
            id="acquisitionDate"
            type="date"
            value={formData.acquisitionDate}
            onChange={(e) => setFormData({ ...formData, acquisitionDate: e.target.value })}
          />
        </div>
      </div>

      <div>
        <label htmlFor="breeder" className="block text-sm font-medium mb-1">
          Breeder / Source
        </label>
        <Input
          id="breeder"
          value={formData.breeder}
          onChange={(e) => setFormData({ ...formData, breeder: e.target.value })}
          placeholder="Where did you get this reptile?"
        />
      </div>

      <div>
        <label htmlFor="notes" className="block text-sm font-medium mb-1">
          Notes
        </label>
        <textarea
          id="notes"
          className="flex min-h-[80px] w-full rounded-md border border-warm-300 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-warm-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder="Any additional notes..."
        />
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={() => window.history.back()}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Saving...' : initialData ? 'Update Reptile' : 'Add Reptile'}
        </Button>
      </div>
    </form>
  )
}
