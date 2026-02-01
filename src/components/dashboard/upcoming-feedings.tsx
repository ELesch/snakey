'use client'

import Link from 'next/link'
import { UtensilsCrossed, Loader2, AlertCircle } from 'lucide-react'
import { useUpcomingFeedings } from '@/hooks/use-dashboard'

function formatFeedingStatus(daysOverdue: number): string {
  if (daysOverdue > 0) {
    return `${daysOverdue} day${daysOverdue > 1 ? 's' : ''} overdue`
  }
  if (daysOverdue === 0) {
    return 'Due today'
  }
  const daysUntil = Math.abs(daysOverdue)
  if (daysUntil === 1) {
    return 'Due tomorrow'
  }
  return `Due in ${daysUntil} days`
}

function getFeedingUrgencyColor(daysUntilDue: number): string {
  if (daysUntilDue < 0) return 'text-red-600' // Overdue
  if (daysUntilDue === 0) return 'text-amber-600' // Due today
  if (daysUntilDue === 1) return 'text-amber-500' // Due tomorrow
  return 'text-warm-600' // Later
}

export function UpcomingFeedings() {
  const { feedings, isPending, isError } = useUpcomingFeedings(7)

  if (isPending) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-[var(--color-muted-foreground)]" />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="text-center py-8 text-[var(--color-muted-foreground)]">
        <AlertCircle className="h-8 w-8 mx-auto mb-2 text-[var(--color-destructive)]" />
        <p>Could not load feedings</p>
        <p className="text-sm">Please try again later</p>
      </div>
    )
  }

  if (!feedings || feedings.length === 0) {
    return (
      <div className="text-center py-8 text-[var(--color-muted-foreground)]">
        <UtensilsCrossed className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p className="font-medium">All caught up!</p>
        <p className="text-sm">No feedings scheduled for the next 7 days</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {feedings.map((feeding) => {
        const now = new Date()
        const dueDate = new Date(feeding.dueDate)
        const daysUntilDue = Math.floor(
          (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        )

        return (
          <Link
            key={feeding.id}
            href={`/reptiles/${feeding.reptileId}`}
            className="flex items-center justify-between p-3 rounded-lg hover:bg-[var(--color-muted)] transition-colors"
          >
            <div>
              <p className="font-medium text-[var(--color-foreground)]">{feeding.reptileName}</p>
              <p className="text-sm text-[var(--color-muted-foreground)]">{feeding.species}</p>
            </div>
            <div className="text-right">
              <p className={`text-sm font-medium ${getFeedingUrgencyColor(daysUntilDue)}`}>
                {formatFeedingStatus(daysUntilDue)}
              </p>
              <p className="text-xs text-[var(--color-muted-foreground)]">
                {feeding.daysSinceLastFeeding} days since last
              </p>
            </div>
          </Link>
        )
      })}
    </div>
  )
}
