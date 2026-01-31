import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ReptileHeader } from '@/components/reptiles/reptile-header'
import { ReptileOverview } from '@/components/reptiles/reptile-overview'
import { FeedingHistory } from '@/components/reptiles/feeding-history'
import { ShedHistory } from '@/components/reptiles/shed-history'
import { WeightHistory } from '@/components/reptiles/weight-history'
import { EnvironmentHistory } from '@/components/reptiles/environment-history'
import { ReptileDetailSkeleton } from '@/components/reptiles/reptile-detail-skeleton'

interface ReptileDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function ReptileDetailPage({ params }: ReptileDetailPageProps) {
  const { id } = await params

  if (!id) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <Suspense fallback={<ReptileDetailSkeleton />}>
        <ReptileHeader reptileId={id} />

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="feedings">Feedings</TabsTrigger>
            <TabsTrigger value="sheds">Sheds</TabsTrigger>
            <TabsTrigger value="weights">Weights</TabsTrigger>
            <TabsTrigger value="environment">Environment</TabsTrigger>
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
        </Tabs>
      </Suspense>
    </div>
  )
}
