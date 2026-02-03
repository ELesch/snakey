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
import { useReptiles } from '@/hooks/use-reptiles'
import { useCreatePairing, useUpdatePairing } from '@/hooks/use-breeding'
import type { Pairing, Reptile } from '@/generated/prisma/client'

interface PairingFormProps {
  pairing?: Pairing
  onSuccess: () => void
  onCancel: () => void
}

export function PairingForm({ pairing, onSuccess, onCancel }: PairingFormProps) {
  const { reptiles } = useReptiles()
  const createMutation = useCreatePairing()
  const updateMutation = useUpdatePairing()

  const [maleId, setMaleId] = useState(pairing?.maleId ?? '')
  const [femaleId, setFemaleId] = useState(pairing?.femaleId ?? '')
  const [startDate, setStartDate] = useState(
    pairing?.startDate
      ? new Date(pairing.startDate).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0]
  )
  const [endDate, setEndDate] = useState(
    pairing?.endDate
      ? new Date(pairing.endDate).toISOString().split('T')[0]
      : ''
  )
  const [successful, setSuccessful] = useState<string>(
    pairing?.successful === true
      ? 'true'
      : pairing?.successful === false
        ? 'false'
        : ''
  )
  const [notes, setNotes] = useState(pairing?.notes ?? '')

  const males = (reptiles as Reptile[]).filter((r) => r.sex === 'MALE')
  const females = (reptiles as Reptile[]).filter((r) => r.sex === 'FEMALE')

  const isPending = createMutation.isPending || updateMutation.isPending

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const data = {
      maleId,
      femaleId,
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : null,
      successful: successful === 'true' ? true : successful === 'false' ? false : null,
      notes: notes || null,
    }

    if (pairing) {
      await updateMutation.mutateAsync({
        pairingId: pairing.id,
        data,
      })
    } else {
      await createMutation.mutateAsync(data)
    }

    onSuccess()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="male" className="block text-sm font-medium text-warm-700 mb-1">
          Male <span className="text-red-500" aria-hidden="true">*</span>
        </label>
        <Select value={maleId} onValueChange={setMaleId} required>
          <SelectTrigger id="male" aria-required="true">
            <SelectValue placeholder="Select male" />
          </SelectTrigger>
          <SelectContent>
            {males.length === 0 ? (
              <SelectItem value="_none" disabled>
                No males available
              </SelectItem>
            ) : (
              males.map((reptile) => (
                <SelectItem key={reptile.id} value={reptile.id}>
                  {reptile.name} ({reptile.species})
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>

      <div>
        <label htmlFor="female" className="block text-sm font-medium text-warm-700 mb-1">
          Female <span className="text-red-500" aria-hidden="true">*</span>
        </label>
        <Select value={femaleId} onValueChange={setFemaleId} required>
          <SelectTrigger id="female" aria-required="true">
            <SelectValue placeholder="Select female" />
          </SelectTrigger>
          <SelectContent>
            {females.length === 0 ? (
              <SelectItem value="_none" disabled>
                No females available
              </SelectItem>
            ) : (
              females.map((reptile) => (
                <SelectItem key={reptile.id} value={reptile.id}>
                  {reptile.name} ({reptile.species})
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="startDate" className="block text-sm font-medium text-warm-700 mb-1">
            Start Date <span className="text-red-500" aria-hidden="true">*</span>
          </label>
          <Input
            id="startDate"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            required
            aria-required="true"
          />
        </div>

        <div>
          <label htmlFor="endDate" className="block text-sm font-medium text-warm-700 mb-1">
            End Date
          </label>
          <Input
            id="endDate"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
      </div>

      <div>
        <label htmlFor="outcome" className="block text-sm font-medium text-warm-700 mb-1">
          Outcome
        </label>
        <Select value={successful} onValueChange={setSuccessful}>
          <SelectTrigger id="outcome">
            <SelectValue placeholder="Not yet determined" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pending">Not yet determined</SelectItem>
            <SelectItem value="true">Successful</SelectItem>
            <SelectItem value="false">Unsuccessful</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <label htmlFor="pairing-notes" className="block text-sm font-medium text-warm-700 mb-1">
          Notes
        </label>
        <textarea
          id="pairing-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm text-[var(--color-foreground)] placeholder:text-[var(--color-muted-foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] focus-visible:ring-offset-2"
          rows={3}
          placeholder="Optional notes about the pairing..."
        />
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isPending || !maleId || !femaleId}>
          {isPending ? 'Saving...' : pairing ? 'Update' : 'Create'}
        </Button>
      </div>
    </form>
  )
}
