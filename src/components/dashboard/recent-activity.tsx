'use client'

import Link from 'next/link'
import { formatRelativeTime } from '@/lib/utils'
import {
  UtensilsCrossed,
  Layers,
  Scale,
  Thermometer,
  Camera,
  Loader2,
  AlertCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useRecentActivity } from '@/hooks/use-dashboard'
import type { ActivityType } from '@/services/dashboard.service'

const activityIcons: Record<ActivityType, typeof UtensilsCrossed> = {
  feeding: UtensilsCrossed,
  shed: Layers,
  weight: Scale,
  environment: Thermometer,
  photo: Camera,
}

const activityColors: Record<ActivityType, string> = {
  feeding: 'bg-green-100 text-green-700',
  shed: 'bg-purple-100 text-purple-700',
  weight: 'bg-blue-100 text-blue-700',
  environment: 'bg-amber-100 text-amber-700',
  photo: 'bg-pink-100 text-pink-700',
}

export function RecentActivity() {
  const { activity, isPending, isError } = useRecentActivity(10)

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
        <p>Could not load activity</p>
        <p className="text-sm">Please try again later</p>
      </div>
    )
  }

  if (!activity || activity.length === 0) {
    return (
      <div className="text-center py-8 text-[var(--color-muted-foreground)]">
        <Layers className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p className="font-medium">No activity yet</p>
        <p className="text-sm">Events will appear here as you log them</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {activity.map((item) => {
        const Icon = activityIcons[item.type]
        return (
          <Link
            key={item.id}
            href={`/reptiles/${item.reptileId}`}
            className="flex items-start gap-3 hover:bg-[var(--color-muted)] rounded-lg p-2 -mx-2 transition-colors"
          >
            <div className={cn('p-2 rounded-full', activityColors[item.type])}>
              <Icon className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[var(--color-foreground)]">
                {item.reptileName}
              </p>
              <p className="text-sm text-[var(--color-muted-foreground)] truncate">{item.description}</p>
            </div>
            <p className="text-xs text-[var(--color-muted-foreground)] whitespace-nowrap">
              {formatRelativeTime(new Date(item.timestamp))}
            </p>
          </Link>
        )
      })}
    </div>
  )
}
