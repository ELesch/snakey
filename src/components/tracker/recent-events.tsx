'use client'

import { useReptileActivity, type ActivityEvent } from '@/hooks/use-reptile-activity'
import { Utensils, Sparkles, Loader2 } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface RecentEventsProps {
  reptileId: string
}

const EVENT_ICONS: Record<ActivityEvent['type'], React.ElementType> = {
  feeding: Utensils,
  shed: Sparkles,
}

const EVENT_LABELS: Record<ActivityEvent['type'], string> = {
  feeding: 'Feeding',
  shed: 'Shed',
}

export function RecentEvents({ reptileId }: RecentEventsProps) {
  const { activities, isPending } = useReptileActivity(reptileId, 5)

  if (isPending) {
    return (
      <div className="flex items-center justify-center py-4 text-[var(--color-muted-foreground)]">
        <Loader2 className="h-5 w-5 animate-spin mr-2" aria-hidden="true" />
        <span className="text-sm">Loading recent events...</span>
      </div>
    )
  }

  if (activities.length === 0) {
    return (
      <div className="text-center py-4 text-[var(--color-muted-foreground)]">
        <p className="text-sm">No recent events logged</p>
      </div>
    )
  }

  return (
    <div>
      <h3 className="text-sm font-medium text-[var(--color-foreground)] mb-3">
        Recent Activity
      </h3>
      <ul className="space-y-2" role="list">
        {activities.map((event) => {
          const Icon = EVENT_ICONS[event.type]
          return (
            <li
              key={`${event.type}-${event.id}`}
              className="flex items-center gap-3 p-2 rounded-md bg-[var(--color-muted)]/50"
            >
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[var(--color-primary)]/10 flex items-center justify-center">
                <Icon className="h-4 w-4 text-[var(--color-primary)]" aria-hidden="true" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[var(--color-foreground)] truncate">
                  {EVENT_LABELS[event.type]}
                </p>
                <p className="text-xs text-[var(--color-muted-foreground)] truncate">
                  {event.description}
                </p>
              </div>
              <time
                className="text-xs text-[var(--color-muted-foreground)] flex-shrink-0"
                dateTime={event.date.toISOString()}
              >
                {formatDistanceToNow(event.date, { addSuffix: true })}
              </time>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
