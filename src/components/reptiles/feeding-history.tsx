'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { formatDate } from '@/lib/utils'
import { Plus, UtensilsCrossed, Check, X, Loader2, WifiOff } from 'lucide-react'
import { useFeedings } from '@/hooks/use-feedings'

interface FeedingHistoryProps {
  reptileId: string
}

export function FeedingHistory({ reptileId }: FeedingHistoryProps) {
  const [showForm, setShowForm] = useState(false)
  const { feedings, isPending, isError, isOfflineData } = useFeedings(reptileId)

  // Show loading state
  if (isPending) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Feeding History</h3>
          <Button onClick={() => setShowForm(true)} size="sm" disabled>
            <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
            Log Feeding
          </Button>
        </div>
        <Card>
          <CardContent className="py-12 text-center">
            <Loader2 className="h-8 w-8 mx-auto mb-4 text-warm-400 animate-spin" aria-hidden="true" />
            <p className="text-warm-500">Loading feeding history...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Show error state
  if (isError) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Feeding History</h3>
          <Button onClick={() => setShowForm(true)} size="sm">
            <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
            Log Feeding
          </Button>
        </div>
        <Card>
          <CardContent className="py-12 text-center">
            <X className="h-12 w-12 mx-auto mb-4 text-red-300" aria-hidden="true" />
            <p className="text-red-600">Failed to load feeding history</p>
            <p className="text-sm text-warm-500">Please try again later</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold">Feeding History</h3>
          {isOfflineData && (
            <span>
              <WifiOff className="h-4 w-4 text-warm-400" aria-hidden="true" />
              <span className="sr-only">Showing offline data</span>
            </span>
          )}
        </div>
        <Button onClick={() => setShowForm(true)} size="sm">
          <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
          Log Feeding
        </Button>
      </div>

      {/* TODO: Feeding form modal */}

      {feedings.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <UtensilsCrossed className="h-12 w-12 mx-auto mb-4 text-warm-300" aria-hidden="true" />
            <p className="text-warm-600">No feeding records yet</p>
            <p className="text-sm text-warm-500">Click &quot;Log Feeding&quot; to add one</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {feedings.map((feeding) => {
            // Handle both API format (Date object) and offline format (timestamp number)
            const feedingDate = typeof feeding.date === 'number'
              ? new Date(feeding.date)
              : new Date(feeding.date)

            return (
              <Card key={feeding.id}>
                <CardContent className="py-3 px-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {feeding.accepted ? (
                        <div className="p-1.5 bg-green-100 rounded-full">
                          <Check className="h-4 w-4 text-green-600" aria-hidden="true" />
                          <span className="sr-only">Accepted</span>
                        </div>
                      ) : (
                        <div className="p-1.5 bg-red-100 rounded-full">
                          <X className="h-4 w-4 text-red-600" aria-hidden="true" />
                          <span className="sr-only">Refused</span>
                        </div>
                      )}
                      <div>
                        <p className="font-medium">
                          {feeding.preySize} {feeding.preyType}
                        </p>
                        <p className="text-sm text-warm-500">{formatDate(feedingDate)}</p>
                      </div>
                    </div>
                    {feeding.notes && (
                      <p className="text-sm text-warm-600 max-w-xs truncate">
                        {feeding.notes}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
