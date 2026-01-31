import { formatRelativeTime } from '@/lib/utils'
import { UtensilsCrossed, Layers, Scale, Thermometer, Camera } from 'lucide-react'
import { cn } from '@/lib/utils'

type ActivityType = 'feeding' | 'shed' | 'weight' | 'environment' | 'photo'

interface Activity {
  id: string
  type: ActivityType
  reptileName: string
  description: string
  timestamp: Date
}

// TODO: Fetch from API or offline DB
const activities: Activity[] = []

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
  if (activities.length === 0) {
    return (
      <div className="text-center py-8 text-warm-500">
        <Layers className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p>No recent activity</p>
        <p className="text-sm">Start logging events for your reptiles</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {activities.map((activity) => {
        const Icon = activityIcons[activity.type]
        return (
          <div key={activity.id} className="flex items-start gap-3">
            <div className={cn('p-2 rounded-full', activityColors[activity.type])}>
              <Icon className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-warm-900">
                {activity.reptileName}
              </p>
              <p className="text-sm text-warm-600 truncate">
                {activity.description}
              </p>
            </div>
            <p className="text-xs text-warm-500 whitespace-nowrap">
              {formatRelativeTime(activity.timestamp)}
            </p>
          </div>
        )
      })}
    </div>
  )
}
