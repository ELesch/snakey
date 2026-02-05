'use client'

import { useMemo } from 'react'
import { useFeedings, useSheds } from '@/hooks'

export interface ActivityEvent {
  id: string
  type: 'feeding' | 'shed'
  date: Date
  description: string
}

export function useReptileActivity(reptileId: string, limit = 5) {
  const { feedings, isPending: feedingsPending } = useFeedings(reptileId)
  const { sheds, isPending: shedsPending } = useSheds(reptileId)

  const activities = useMemo(() => {
    const events: ActivityEvent[] = []

    // Add feeding events
    feedings.slice(0, limit).forEach((feeding) => {
      const date = 'date' in feeding && feeding.date instanceof Date
        ? feeding.date
        : new Date(feeding.date as number | string)
      events.push({
        id: feeding.id,
        type: 'feeding',
        date,
        description: `${feeding.preyType} (${feeding.preySize})${feeding.accepted ? '' : ' - refused'}`,
      })
    })

    // Add shed events
    sheds.slice(0, limit).forEach((shed) => {
      const date = 'completedDate' in shed
        ? (shed.completedDate instanceof Date ? shed.completedDate : new Date(shed.completedDate as number | string))
        : new Date()
      events.push({
        id: shed.id,
        type: 'shed',
        date,
        description: `${shed.quality} shed${shed.isComplete ? '' : ' (incomplete)'}`,
      })
    })

    // Sort by date descending and limit
    return events
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .slice(0, limit)
  }, [feedings, sheds, limit])

  return {
    activities,
    isPending: feedingsPending || shedsPending,
  }
}
