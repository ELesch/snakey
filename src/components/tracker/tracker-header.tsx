'use client'

import { useEffect, useState } from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useReptiles } from '@/hooks'
import { Loader2 } from 'lucide-react'
import type { Reptile } from '@/generated/prisma/client'
import type { OfflineReptile } from '@/lib/offline/db'

const STORAGE_KEY = 'snakey-selected-reptile'

interface TrackerHeaderProps {
  selectedReptileId: string | null
  onReptileChange: (reptileId: string) => void
}

export function TrackerHeader({
  selectedReptileId,
  onReptileChange,
}: TrackerHeaderProps) {
  const { reptiles, isPending } = useReptiles()
  const [isHydrated, setIsHydrated] = useState(false)

  // Hydration check for localStorage
  useEffect(() => {
    setIsHydrated(true)
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored && !selectedReptileId) {
      onReptileChange(stored)
    }
  }, [selectedReptileId, onReptileChange])

  // Persist selection to localStorage
  useEffect(() => {
    if (selectedReptileId) {
      localStorage.setItem(STORAGE_KEY, selectedReptileId)
    }
  }, [selectedReptileId])

  // Auto-select first reptile if none selected
  useEffect(() => {
    if (!selectedReptileId && reptiles.length > 0 && isHydrated) {
      const stored = localStorage.getItem(STORAGE_KEY)
      const validStored = reptiles.find(
        (r: Reptile | OfflineReptile) => r.id === stored
      )
      if (validStored) {
        onReptileChange(stored!)
      } else {
        onReptileChange(reptiles[0].id)
      }
    }
  }, [reptiles, selectedReptileId, isHydrated, onReptileChange])

  const selectedReptile = reptiles.find(
    (r: Reptile | OfflineReptile) => r.id === selectedReptileId
  )

  if (isPending) {
    return (
      <div className="flex items-center gap-2 text-warm-700">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm">Loading reptiles...</span>
      </div>
    )
  }

  if (reptiles.length === 0) {
    return (
      <div className="text-warm-700 text-sm">
        No reptiles found. Add a reptile first to start tracking.
      </div>
    )
  }

  return (
    <div className="space-y-1">
      <label
        htmlFor="reptile-select"
        className="block text-sm font-medium text-warm-700"
      >
        Select Reptile
      </label>
      <Select value={selectedReptileId ?? ''} onValueChange={onReptileChange}>
        <SelectTrigger id="reptile-select" className="w-full md:w-64">
          <SelectValue placeholder="Select a reptile">
            {selectedReptile
              ? `${selectedReptile.name} (${selectedReptile.species})`
              : 'Select a reptile'}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {reptiles.map((reptile: Reptile | OfflineReptile) => (
            <SelectItem key={reptile.id} value={reptile.id}>
              {reptile.name} ({reptile.species})
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
