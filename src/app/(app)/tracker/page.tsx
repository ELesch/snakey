'use client'

import { useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TrackerHeader } from '@/components/tracker/tracker-header'
import { TrackerTabs } from '@/components/tracker/tracker-tabs'
import { ClipboardList } from 'lucide-react'

export default function TrackerPage() {
  const [selectedReptileId, setSelectedReptileId] = useState<string | null>(null)

  const handleReptileChange = useCallback((reptileId: string) => {
    setSelectedReptileId(reptileId)
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-warm-900">Quick Tracker</h1>
        <p className="text-warm-600">
          Log events quickly without navigating to individual reptile profiles
        </p>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <ClipboardList className="h-5 w-5 text-primary" />
            </div>
            <CardTitle className="text-lg">Log Care Event</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <TrackerHeader
            selectedReptileId={selectedReptileId}
            onReptileChange={handleReptileChange}
          />

          {selectedReptileId ? (
            <TrackerTabs reptileId={selectedReptileId} />
          ) : (
            <div className="text-center py-8 text-warm-700">
              <ClipboardList className="h-12 w-12 mx-auto mb-3 text-warm-400" />
              <p>Select a reptile to start logging events</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
