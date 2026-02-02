'use client'

import { use } from 'react'
import { notFound, useRouter, useSearchParams } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ReptileHeader } from '@/components/reptiles/reptile-header'
import { ReptileOverview } from '@/components/reptiles/reptile-overview'
import { FeedingHistory } from '@/components/reptiles/feeding-history'
import { ShedHistory } from '@/components/reptiles/shed-history'
import { WeightHistory } from '@/components/reptiles/weight-history'
import { EnvironmentHistory } from '@/components/reptiles/environment-history'
import { PhotoGallery } from '@/components/reptiles/photo-gallery'
import { VetHistory } from '@/components/reptiles/vet-history'
import { MedicationList } from '@/components/reptiles/medication-list'

const VALID_TABS = [
  'overview',
  'feedings',
  'sheds',
  'weights',
  'environment',
  'photos',
  'vet',
  'medications',
] as const

type TabValue = (typeof VALID_TABS)[number]

interface ReptileDetailPageProps {
  params: Promise<{ id: string }>
}

export default function ReptileDetailPage({ params }: ReptileDetailPageProps) {
  const { id } = use(params)
  const router = useRouter()
  const searchParams = useSearchParams()

  if (!id) {
    notFound()
  }

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
    router.push(`/reptiles/${id}${query ? `?${query}` : ''}`, { scroll: false })
  }

  return (
    <div className="space-y-6 overflow-x-hidden">
      <ReptileHeader reptileId={id} />

      <Tabs value={currentTab} onValueChange={handleTabChange} className="space-y-4">
        <TabsList className="flex overflow-x-auto h-auto gap-1 pb-1 max-w-full">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="feedings">Feedings</TabsTrigger>
          <TabsTrigger value="sheds">Sheds</TabsTrigger>
          <TabsTrigger value="weights">Weights</TabsTrigger>
          <TabsTrigger value="environment">Environment</TabsTrigger>
          <TabsTrigger value="photos">Photos</TabsTrigger>
          <TabsTrigger value="vet">Vet</TabsTrigger>
          <TabsTrigger value="medications">Medications</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <ReptileOverview reptileId={id} />
        </TabsContent>

        <TabsContent value="feedings">
          <FeedingHistory reptileId={id} />
        </TabsContent>

        <TabsContent value="sheds">
          <ShedHistory reptileId={id} />
        </TabsContent>

        <TabsContent value="weights">
          <WeightHistory reptileId={id} />
        </TabsContent>

        <TabsContent value="environment">
          <EnvironmentHistory reptileId={id} />
        </TabsContent>

        <TabsContent value="photos">
          <PhotoGallery reptileId={id} />
        </TabsContent>

        <TabsContent value="vet">
          <VetHistory reptileId={id} />
        </TabsContent>

        <TabsContent value="medications">
          <MedicationList reptileId={id} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
