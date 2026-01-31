import Link from 'next/link'
import { UtensilsCrossed } from 'lucide-react'
import { formatRelativeTime } from '@/lib/utils'

interface UpcomingFeeding {
  id: string
  reptileId: string
  reptileName: string
  species: string
  dueDate: Date
}

// TODO: Fetch from API or offline DB
const upcomingFeedings: UpcomingFeeding[] = []

export function UpcomingFeedings() {
  if (upcomingFeedings.length === 0) {
    return (
      <div className="text-center py-8 text-warm-500">
        <UtensilsCrossed className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p>No upcoming feedings</p>
        <p className="text-sm">Add reptiles to start tracking</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {upcomingFeedings.map((feeding) => (
        <Link
          key={feeding.id}
          href={`/reptiles/${feeding.reptileId}`}
          className="flex items-center justify-between p-3 rounded-lg hover:bg-warm-50 transition-colors"
        >
          <div>
            <p className="font-medium text-warm-900">{feeding.reptileName}</p>
            <p className="text-sm text-warm-500">{feeding.species}</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-amber-600">
              {formatRelativeTime(feeding.dueDate)}
            </p>
          </div>
        </Link>
      ))}
    </div>
  )
}
