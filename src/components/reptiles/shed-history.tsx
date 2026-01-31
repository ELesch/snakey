'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { formatDate } from '@/lib/utils'
import { Plus, Layers, Check, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Shed {
  id: string
  date: Date
  quality: 'complete' | 'partial' | 'stuck'
  notes?: string
}

interface ShedHistoryProps {
  reptileId: string
}

const qualityLabels = {
  complete: { label: 'Complete', color: 'bg-green-100 text-green-700', icon: Check },
  partial: { label: 'Partial', color: 'bg-amber-100 text-amber-700', icon: AlertTriangle },
  stuck: { label: 'Stuck Shed', color: 'bg-red-100 text-red-700', icon: AlertTriangle },
}

export function ShedHistory({ reptileId }: ShedHistoryProps) {
  const [showForm, setShowForm] = useState(false)

  // TODO: Fetch from API or offline DB
  const sheds: Shed[] = []

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Shed History</h3>
        <Button onClick={() => setShowForm(true)} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Log Shed
        </Button>
      </div>

      {/* TODO: Shed form modal */}

      {sheds.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Layers className="h-12 w-12 mx-auto mb-4 text-warm-300" />
            <p className="text-warm-600">No shed records yet</p>
            <p className="text-sm text-warm-500">Click &quot;Log Shed&quot; to add one</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {sheds.map((shed) => {
            const qualityInfo = qualityLabels[shed.quality]
            const Icon = qualityInfo.icon
            return (
              <Card key={shed.id}>
                <CardContent className="py-3 px-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={cn('px-2 py-1 rounded text-sm font-medium', qualityInfo.color)}>
                        <Icon className="h-4 w-4 inline mr-1" />
                        {qualityInfo.label}
                      </div>
                      <p className="text-warm-600">{formatDate(shed.date)}</p>
                    </div>
                    {shed.notes && (
                      <p className="text-sm text-warm-600 max-w-xs truncate">
                        {shed.notes}
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
