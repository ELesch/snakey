'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { formatDate } from '@/lib/utils'
import { Plus, UtensilsCrossed, Check, X } from 'lucide-react'

interface Feeding {
  id: string
  date: Date
  preyType: string
  preySize: string
  preyCount: number
  wasEaten: boolean
  notes?: string
}

interface FeedingHistoryProps {
  reptileId: string
}

export function FeedingHistory({ reptileId }: FeedingHistoryProps) {
  const [showForm, setShowForm] = useState(false)

  // TODO: Fetch from API or offline DB
  const feedings: Feeding[] = []

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Feeding History</h3>
        <Button onClick={() => setShowForm(true)} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Log Feeding
        </Button>
      </div>

      {/* TODO: Feeding form modal */}

      {feedings.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <UtensilsCrossed className="h-12 w-12 mx-auto mb-4 text-warm-300" />
            <p className="text-warm-600">No feeding records yet</p>
            <p className="text-sm text-warm-500">Click &quot;Log Feeding&quot; to add one</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {feedings.map((feeding) => (
            <Card key={feeding.id}>
              <CardContent className="py-3 px-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {feeding.wasEaten ? (
                      <div className="p-1.5 bg-green-100 rounded-full">
                        <Check className="h-4 w-4 text-green-600" />
                      </div>
                    ) : (
                      <div className="p-1.5 bg-red-100 rounded-full">
                        <X className="h-4 w-4 text-red-600" />
                      </div>
                    )}
                    <div>
                      <p className="font-medium">
                        {feeding.preyCount}x {feeding.preySize} {feeding.preyType}
                      </p>
                      <p className="text-sm text-warm-500">{formatDate(feeding.date)}</p>
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
          ))}
        </div>
      )}
    </div>
  )
}
