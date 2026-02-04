'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useCreateClutch, useUpdateClutch } from '@/hooks/use-breeding'
import type { Clutch } from '@/generated/prisma/client'

interface ClutchFormProps {
  pairingId: string
  clutch?: Clutch
  onSuccess: () => void
  onCancel: () => void
}

export function ClutchForm({ pairingId, clutch, onSuccess, onCancel }: ClutchFormProps) {
  const createMutation = useCreateClutch(pairingId)
  const updateMutation = useUpdateClutch()

  const [layDate, setLayDate] = useState(
    clutch?.layDate
      ? new Date(clutch.layDate).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0]
  )
  const [eggCount, setEggCount] = useState(clutch?.eggCount?.toString() ?? '')
  const [fertileCount, setFertileCount] = useState(
    clutch?.fertileCount?.toString() ?? ''
  )
  const [incubationTemp, setIncubationTemp] = useState(
    clutch?.incubationTemp?.toString() ?? ''
  )
  const [dueDate, setDueDate] = useState(
    clutch?.dueDate
      ? new Date(clutch.dueDate).toISOString().split('T')[0]
      : ''
  )
  const [notes, setNotes] = useState(clutch?.notes ?? '')

  const isPending = createMutation.isPending || updateMutation.isPending

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const data = {
      layDate: new Date(layDate),
      eggCount: parseInt(eggCount, 10),
      fertileCount: fertileCount ? parseInt(fertileCount, 10) : null,
      incubationTemp: incubationTemp ? parseFloat(incubationTemp) : null,
      dueDate: dueDate ? new Date(dueDate) : null,
      notes: notes || null,
    }

    if (clutch) {
      await updateMutation.mutateAsync({
        clutchId: clutch.id,
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
          <label className="block text-sm font-medium text-warm-700 dark:text-warm-300 mb-1">
            Lay Date
          </label>
          <Input
            type="date"
            value={layDate}
            onChange={(e) => setLayDate(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-warm-700 dark:text-warm-300 mb-1">
            Due Date
          </label>
          <Input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-warm-700 dark:text-warm-300 mb-1">
            Total Eggs
          </label>
          <Input
            type="number"
            min="1"
            value={eggCount}
            onChange={(e) => setEggCount(e.target.value)}
            required
            placeholder="Number of eggs"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-warm-700 dark:text-warm-300 mb-1">
            Fertile Eggs
          </label>
          <Input
            type="number"
            min="0"
            value={fertileCount}
            onChange={(e) => setFertileCount(e.target.value)}
            placeholder="Optional"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-warm-700 dark:text-warm-300 mb-1">
          Incubation Temperature (F)
        </label>
        <Input
          type="number"
          step="0.1"
          value={incubationTemp}
          onChange={(e) => setIncubationTemp(e.target.value)}
          placeholder="e.g., 88.5"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-warm-700 dark:text-warm-300 mb-1">
          Notes
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm text-[var(--color-foreground)] placeholder:text-[var(--color-muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)] focus:ring-offset-2"
          rows={2}
          placeholder="Optional notes about the clutch..."
        />
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isPending || !eggCount}>
          {isPending ? 'Saving...' : clutch ? 'Update' : 'Create'}
        </Button>
      </div>
    </form>
  )
}
