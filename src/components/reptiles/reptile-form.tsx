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
import { useCreateReptile, useUpdateReptile } from '@/hooks'
import { AlertCircle, Loader2 } from 'lucide-react'
import type { Reptile } from '@/generated/prisma/client'

interface ReptileFormProps {
  onSuccess?: (reptile: Reptile) => void
  onCancel?: () => void
  initialData?: Partial<Reptile>
  reptileId?: string
}

export function ReptileForm({
  onSuccess,
  onCancel,
  initialData,
  reptileId,
}: ReptileFormProps) {
  const isEditing = Boolean(reptileId)
  const createMutation = useCreateReptile()
  const updateMutation = useUpdateReptile()

  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    species: initialData?.species || '',
    morph: initialData?.morph || '',
    sex: initialData?.sex || 'UNKNOWN',
    birthDate: initialData?.birthDate
      ? new Date(initialData.birthDate).toISOString().split('T')[0]
      : '',
    acquisitionDate: initialData?.acquisitionDate
      ? new Date(initialData.acquisitionDate).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0],
    notes: initialData?.notes || '',
    isPublic: initialData?.isPublic || false,
  })

  const [error, setError] = useState<string | null>(null)

  const speciesOptions = getSpeciesOptions()

  const isPending = createMutation.isPending || updateMutation.isPending

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Basic validation
    if (!formData.name.trim()) {
      setError('Name is required')
      return
    }
    if (!formData.species) {
      setError('Species is required')
      return
    }
    if (!formData.acquisitionDate) {
      setError('Acquisition date is required')
      return
    }

    const payload = {
      name: formData.name.trim(),
      species: formData.species,
      morph: formData.morph.trim() || null,
      sex: formData.sex as 'MALE' | 'FEMALE' | 'UNKNOWN',
      birthDate: formData.birthDate ? new Date(formData.birthDate) : null,
      acquisitionDate: new Date(formData.acquisitionDate),
      notes: formData.notes.trim() || null,
      isPublic: formData.isPublic,
    }

    try {
      if (isEditing && reptileId) {
        const updated = await updateMutation.mutateAsync({
          id: reptileId,
          data: payload,
        })
        onSuccess?.(updated)
      } else {
        const created = await createMutation.mutateAsync(payload)
        onSuccess?.(created)
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save reptile'
      setError(message)
    }
  }

  const handleCancel = () => {
    if (onCancel) {
      onCancel()
    } else {
      window.history.back()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div
          className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2 text-sm text-red-800"
          role="alert"
          aria-live="polite"
        >
          <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}

      <div>
        <label htmlFor="name" className="block text-sm font-medium mb-1">
          Name <span className="text-red-500">*</span>
        </label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Enter reptile name"
          disabled={isPending}
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
          disabled={isPending}
        >
          <SelectTrigger id="species">
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
          disabled={isPending}
        />
      </div>

      <div>
        <label htmlFor="sex" className="block text-sm font-medium mb-1">
          Sex
        </label>
        <Select
          value={formData.sex}
          onValueChange={(value) =>
            setFormData({ ...formData, sex: value as 'MALE' | 'FEMALE' | 'UNKNOWN' })
          }
          disabled={isPending}
        >
          <SelectTrigger id="sex">
            <SelectValue placeholder="Select sex" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="MALE">Male</SelectItem>
            <SelectItem value="FEMALE">Female</SelectItem>
            <SelectItem value="UNKNOWN">Unknown</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="birthDate" className="block text-sm font-medium mb-1">
            Birth/Hatch Date
          </label>
          <Input
            id="birthDate"
            type="date"
            value={formData.birthDate}
            onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
            disabled={isPending}
          />
        </div>

        <div>
          <label htmlFor="acquisitionDate" className="block text-sm font-medium mb-1">
            Acquisition Date <span className="text-red-500">*</span>
          </label>
          <Input
            id="acquisitionDate"
            type="date"
            value={formData.acquisitionDate}
            onChange={(e) => setFormData({ ...formData, acquisitionDate: e.target.value })}
            disabled={isPending}
            required
          />
        </div>
      </div>

      <div>
        <label htmlFor="notes" className="block text-sm font-medium mb-1">
          Notes
        </label>
        <textarea
          id="notes"
          className="flex min-h-[80px] w-full rounded-md border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm text-[var(--color-foreground)] ring-offset-[var(--color-background)] placeholder:text-[var(--color-muted-foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder="Any additional notes..."
          disabled={isPending}
        />
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="isPublic"
          checked={formData.isPublic}
          onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })}
          disabled={isPending}
          className="h-4 w-4 rounded border-warm-300"
        />
        <label htmlFor="isPublic" className="text-sm">
          Make this reptile profile public (shareable)
        </label>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={handleCancel} disabled={isPending}>
          Cancel
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}
          {isEditing ? 'Update Reptile' : 'Add Reptile'}
        </Button>
      </div>
    </form>
  )
}
