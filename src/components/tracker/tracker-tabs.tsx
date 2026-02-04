'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent } from '@/components/ui/card'
import { FeedingForm } from './feeding-form'
import { ShedForm } from './shed-form'
import { EnvironmentForm } from './environment-form'
import { VetForm, MedicationForm } from '@/components/forms'
import { PhotoAttachment } from './photo-attachment'
import { CheckCircle2 } from 'lucide-react'

interface TrackerTabsProps {
  reptileId: string
}

type EventType =
  | 'feeding'
  | 'shed'
  | 'environment'
  | 'vet'
  | 'medication'

const EVENT_TABS: { value: EventType; label: string; photoCategory?: string }[] = [
  { value: 'feeding', label: 'Feeding' },
  { value: 'shed', label: 'Shed', photoCategory: 'SHED' },
  { value: 'environment', label: 'Environment', photoCategory: 'ENCLOSURE' },
  { value: 'vet', label: 'Vet Visit', photoCategory: 'VET' },
  { value: 'medication', label: 'Medication' },
]

export function TrackerTabs({ reptileId }: TrackerTabsProps) {
  const [activeTab, setActiveTab] = useState<EventType>('feeding')
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const handleSuccess = (eventType: string) => {
    setSuccessMessage(`${eventType} logged successfully!`)
    setTimeout(() => setSuccessMessage(null), 3000)
  }

  const currentTab = EVENT_TABS.find((tab) => tab.value === activeTab)

  return (
    <div className="space-y-4">
      <Tabs
        value={activeTab}
        onValueChange={(val) => setActiveTab(val as EventType)}
      >
        <TabsList className="grid grid-cols-3 md:grid-cols-5 w-full">
          {EVENT_TABS.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value} className="text-xs md:text-sm">
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <Card className="mt-4">
          <CardContent className="p-4 md:p-6">
            {successMessage && (
              <div className="mb-4 flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-md text-green-700">
                <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
                <span className="text-sm">{successMessage}</span>
              </div>
            )}

            <TabsContent value="feeding" className="mt-0">
              <FeedingForm
                reptileId={reptileId}
                onSuccess={() => handleSuccess('Feeding')}
              />
            </TabsContent>

            <TabsContent value="shed" className="mt-0 space-y-6">
              <ShedForm
                reptileId={reptileId}
                onSuccess={() => handleSuccess('Shed')}
              />
              <PhotoAttachment reptileId={reptileId} category="SHED" />
            </TabsContent>

            <TabsContent value="environment" className="mt-0 space-y-6">
              <EnvironmentForm
                reptileId={reptileId}
                onSuccess={() => handleSuccess('Environment')}
              />
              <PhotoAttachment reptileId={reptileId} category="ENCLOSURE" />
            </TabsContent>

            <TabsContent value="vet" className="mt-0 space-y-6">
              <VetForm
                reptileId={reptileId}
                onSuccess={() => handleSuccess('Vet visit')}
                compact
              />
              <PhotoAttachment reptileId={reptileId} category="VET" />
            </TabsContent>

            <TabsContent value="medication" className="mt-0">
              <MedicationForm
                reptileId={reptileId}
                onSuccess={() => handleSuccess('Medication')}
                compact
              />
            </TabsContent>
          </CardContent>
        </Card>
      </Tabs>
    </div>
  )
}
