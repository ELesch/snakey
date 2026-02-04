'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ReptileOverview } from '@/components/reptiles/reptile-overview'
import { FeedingHistory } from '@/components/reptiles/feeding-history'
import { ShedHistory } from '@/components/reptiles/shed-history'
import { EnvironmentHistory } from '@/components/reptiles/environment-history'
import { PhotoGallery } from '@/components/reptiles/photo-gallery'
import { VetHistory } from '@/components/reptiles/vet-history'
import { MedicationList } from '@/components/reptiles/medication-list'
import type { Reptile } from '@/generated/prisma/client'

const VALID_TABS = [
  'overview',
  'feedings',
  'sheds',
  'environment',
  'photos',
  'vet',
  'medications',
] as const

type TabValue = (typeof VALID_TABS)[number]

interface ReptileTabsProps {
  reptileId: string
  reptile: Reptile
}

export function ReptileTabs({ reptileId, reptile }: ReptileTabsProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Get tab from URL or default to overview
  const tabParam = searchParams.get('tab')
  const currentTab: TabValue =
    tabParam && VALID_TABS.includes(tabParam as TabValue)
      ? (tabParam as TabValue)
      : 'overview'

  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value === 'overview') {
      params.delete('tab')
    } else {
      params.set('tab', value)
    }
    const query = params.toString()
    router.push(`/reptiles/${reptileId}${query ? `?${query}` : ''}`, { scroll: false })
  }

  return (
    <Tabs value={currentTab} onValueChange={handleTabChange} className="space-y-4 min-w-0">
      <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
        <TabsList className="flex w-max md:w-full h-auto gap-1 pb-1">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="feedings">Feedings</TabsTrigger>
          <TabsTrigger value="sheds">Sheds</TabsTrigger>
          <TabsTrigger value="environment">Environment</TabsTrigger>
          <TabsTrigger value="photos">Photos</TabsTrigger>
          <TabsTrigger value="vet">Vet</TabsTrigger>
          <TabsTrigger value="medications">Medications</TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="overview">
        <ReptileOverview reptileId={reptileId} reptile={reptile} />
      </TabsContent>

      <TabsContent value="feedings">
        <FeedingHistory reptileId={reptileId} />
      </TabsContent>

      <TabsContent value="sheds">
        <ShedHistory reptileId={reptileId} />
      </TabsContent>

      <TabsContent value="environment">
        <EnvironmentHistory reptileId={reptileId} />
      </TabsContent>

      <TabsContent value="photos">
        <PhotoGallery reptileId={reptileId} />
      </TabsContent>

      <TabsContent value="vet">
        <VetHistory reptileId={reptileId} />
      </TabsContent>

      <TabsContent value="medications">
        <MedicationList reptileId={reptileId} />
      </TabsContent>
    </Tabs>
  )
}
