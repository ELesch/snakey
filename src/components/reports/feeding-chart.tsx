'use client'

import dynamic from 'next/dynamic'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { useFeedingStats } from '@/hooks/use-reports'
import { Loader2, UtensilsCrossed } from 'lucide-react'
import type { ReportFilters } from '@/services/reports.service'

// Dynamic import for chart content - only loaded when component mounts
const FeedingChartContent = dynamic(
  () => import('./feeding-chart-content').then((mod) => mod.FeedingChartContent),
  {
    loading: () => <ChartLoadingSkeleton />,
    ssr: false, // Charts don't need server rendering
  }
)

interface FeedingChartProps {
  filters: ReportFilters
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function ChartLoadingSkeleton() {
  return (
    <div className="h-[300px] flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-[var(--color-muted-foreground)]" />
    </div>
  )
}

function ChartSkeleton() {
  return (
    <div className="h-[300px] flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-[var(--color-muted-foreground)]" />
    </div>
  )
}

function EmptyState() {
  return (
    <div className="h-[300px] flex flex-col items-center justify-center text-[var(--color-muted-foreground)]">
      <UtensilsCrossed className="h-12 w-12 mb-2 opacity-50" />
      <p className="text-sm">No feeding data recorded</p>
      <p className="text-xs">Log feedings to track your reptiles' eating habits</p>
    </div>
  )
}

export function FeedingChart({ filters }: FeedingChartProps) {
  const { feedingData, feedingSummary, isPending, isError } = useFeedingStats(filters)

  // Transform data for chart - format dates
  const chartData = feedingData?.map((point) => ({
    ...point,
    dateFormatted: formatDate(point.date),
  }))

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UtensilsCrossed className="h-5 w-5" />
          Feeding History
        </CardTitle>
        {feedingSummary && (
          <CardDescription>
            {feedingSummary.totalFeedings} total feedings |{' '}
            {feedingSummary.acceptanceRate.toFixed(1)}% acceptance rate |{' '}
            {feedingSummary.averageInterval} day avg interval
          </CardDescription>
        )}
      </CardHeader>
      <CardContent>
        {isPending && <ChartSkeleton />}

        {isError && (
          <div className="h-[300px] flex items-center justify-center text-[var(--color-destructive)]">
            Failed to load feeding data
          </div>
        )}

        {!isPending && !isError && (!chartData || chartData.length === 0) && <EmptyState />}

        {!isPending && !isError && chartData && chartData.length > 0 && (
          <>
            {/* Screen reader accessible data table - always rendered immediately */}
            <table className="sr-only">
              <caption>Feeding history data showing accepted, refused, and regurgitated counts</caption>
              <thead>
                <tr>
                  <th scope="col">Date</th>
                  <th scope="col">Accepted</th>
                  <th scope="col">Refused</th>
                  <th scope="col">Regurgitated</th>
                </tr>
              </thead>
              <tbody>
                {chartData.map((point, index) => (
                  <tr key={index}>
                    <td>{point.dateFormatted}</td>
                    <td>{point.accepted}</td>
                    <td>{point.refused}</td>
                    <td>{point.regurgitated}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {/* Visual chart - dynamically loaded */}
            <FeedingChartContent data={chartData} />
          </>
        )}
      </CardContent>
    </Card>
  )
}
