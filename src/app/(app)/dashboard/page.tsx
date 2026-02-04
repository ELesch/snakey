'use client'

import { Suspense } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DashboardSkeleton } from '@/components/dashboard/dashboard-skeleton'
import { UpcomingFeedings } from '@/components/dashboard/upcoming-feedings'
import { RecentActivity } from '@/components/dashboard/recent-activity'
import { CollectionStats } from '@/components/dashboard/collection-stats'
import { EnvironmentAlerts } from '@/components/dashboard/environment-alerts'

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-warm-900 dark:text-warm-100">Dashboard</h1>
        <p className="text-warm-700 dark:text-warm-300">Overview of your reptile collection</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <CollectionStats />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Feedings</CardTitle>
          </CardHeader>
          <CardContent>
            <UpcomingFeedings />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Environment Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <EnvironmentAlerts />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <RecentActivity />
        </CardContent>
      </Card>
    </div>
  )
}
