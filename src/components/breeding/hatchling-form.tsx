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
import { useCreateHatchling, useUpdateHatchling } from '@/hooks/use-breeding'
import type { Hatchling } from '@/generated/prisma/client'

interface HatchlingFormProps {
  clutchId: string
  hatchling?: Hatchling
  onSuccess: () => void
  onCancel: () => void
}

export function HatchlingForm({
  clutchId,
  hatchling,
  onSuccess,
  onCancel,
}: HatchlingFormProps) {
  const createMutation = useCreateHatchling(clutchId)
  const updateMutation = useUpdateHatchling()

  const [hatchDate, setHatchDate] = useState(
    hatchling?.hatchDate
      ? new Date(hatchling.hatchDate).toISOString().split('T')[0]
      : ''
  )
  const [status, setStatus] = useState<string>(hatchling?.status ?? 'DEVELOPING')
  const [morph, setMorph] = useState(hatchling?.morph ?? '')
  const [sex, setSex] = useState<string>(hatchling?.sex ?? 'UNKNOWN')
  const [notes, setNotes] = useState(hatchling?.notes ?? '')

  const isPending = createMutation.isPending || updateMutation.isPending

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const data = {
      hatchDate: hatchDate ? new Date(hatchDate) : null,
      status: status as 'DEVELOPING' | 'HATCHED' | 'FAILED' | 'SOLD' | 'KEPT',
      morph: morph || null,
      sex: sex as 'MALE' | 'FEMALE' | 'UNKNOWN',
      notes: notes || null,
    }

    if (hatchling) {
      await updateMutation.mutateAsync({
        hatchlingId: hatchling.id,
        data,
      })
    } else {
      await createMutation.mutateAsync(data)
    }

    onSuccess()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-warm-700 mb-1">
            Status
          </label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="DEVELOPING">Developing</SelectItem>
              <SelectItem value="HATCHED">Hatched</SelectItem>
              <SelectItem value="FAILED">Failed</SelectItem>
              <SelectItem value="SOLD">Sold</SelectItem>
              <SelectItem value="KEPT">Kept</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="block text-sm font-medium text-warm-700 mb-1">
            Hatch Date
          </label>
          <Input
            type="date"
            value={hatchDate}
            onChange={(e) => setHatchDate(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-warm-700 mb-1">
            Sex
          </label>
          <Select value={sex} onValueChange={setSex}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="UNKNOWN">Unknown</SelectItem>
              <SelectItem value="MALE">Male</SelectItem>
              <SelectItem value="FEMALE">Female</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="block text-sm font-medium text-warm-700 mb-1">
            Morph
          </label>
          <Input
            type="text"
            value={morph}
            onChange={(e) => setMorph(e.target.value)}
            placeholder="e.g., Albino"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-warm-700 mb-1">
          Notes
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm text-[var(--color-foreground)] placeholder:text-[var(--color-muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)] focus:ring-offset-2"
          rows={2}
          placeholder="Optional notes about this hatchling..."
        />
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Saving...' : hatchling ? 'Update' : 'Create'}
        </Button>
      </div>
    </form>
  )
}
