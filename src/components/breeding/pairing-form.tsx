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
        <label className="block text-sm font-medium text-warm-700 mb-1">
          Male
        </label>
        <Select value={maleId} onValueChange={setMaleId} required>
          <SelectTrigger>
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
        <label className="block text-sm font-medium text-warm-700 mb-1">
          Female
        </label>
        <Select value={femaleId} onValueChange={setFemaleId} required>
          <SelectTrigger>
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

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-warm-700 mb-1">
            Start Date
          </label>
          <Input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-warm-700 mb-1">
            End Date
          </label>
          <Input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-warm-700 mb-1">
          Outcome
        </label>
        <Select value={successful} onValueChange={setSuccessful}>
          <SelectTrigger>
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
        <label className="block text-sm font-medium text-warm-700 mb-1">
          Notes
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full rounded-md border border-warm-300 bg-white px-3 py-2 text-sm placeholder:text-warm-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
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
