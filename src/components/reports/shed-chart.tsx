'use client'

import dynamic from 'next/dynamic'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { useShedStats } from '@/hooks/use-reports'
import { Loader2, Sparkles } from 'lucide-react'
import type { ReportFilters } from '@/services/reports.service'

// Dynamic import for chart content - only loaded when component mounts
const ShedChartContent = dynamic(
  () => import('./shed-chart-content').then((mod) => mod.ShedChartContent),
  {
    loading: () => <ChartLoadingSkeleton />,
    ssr: false, // Charts don't need server rendering
  }
)

interface ShedChartProps {
  filters: ReportFilters
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// Color based on shed quality
function getQualityColor(quality: string): string {
  switch (quality.toUpperCase()) {
    case 'EXCELLENT':
      return '#22c55e' // green
    case 'GOOD':
      return '#84cc16' // lime
    case 'FAIR':
      return '#f59e0b' // amber
    case 'POOR':
      return '#ef4444' // red
    default:
      return '#6b7280' // gray
  }
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
      <Sparkles className="h-12 w-12 mb-2 opacity-50" />
      <p className="text-sm">No shed data recorded</p>
      <p className="text-xs">Log sheds to track shedding patterns</p>
    </div>
  )
}

export function ShedChart({ filters }: ShedChartProps) {
  const { shedData, shedSummary, isPending, isError } = useShedStats(filters)

  // Transform data for chart - include duration and formatted date
  const chartData = shedData?.map((point) => ({
    ...point,
    dateFormatted: formatDate(point.date),
    duration: point.durationDays ?? 0,
    color: getQualityColor(point.quality),
  }))

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          Shedding History
        </CardTitle>
        {shedSummary && (
          <CardDescription>
            {shedSummary.totalSheds} total sheds |{' '}
            {shedSummary.averageInterval} day avg interval |{' '}
            Most common quality: {shedSummary.averageQuality}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent>
        {isPending && <ChartSkeleton />}

        {isError && (
          <div className="h-[300px] flex items-center justify-center text-[var(--color-destructive)]">
            Failed to load shed data
          </div>
        )}

        {!isPending && !isError && (!chartData || chartData.length === 0) && <EmptyState />}

        {!isPending && !isError && chartData && chartData.length > 0 && (
          <>
            {/* Screen reader accessible data table - always rendered immediately */}
            <table className="sr-only">
              <caption>Shedding history data showing duration and quality</caption>
              <thead>
                <tr>
                  <th scope="col">Date</th>
                  <th scope="col">Duration (days)</th>
                  <th scope="col">Quality</th>
                </tr>
              </thead>
              <tbody>
                {chartData.map((point, index) => (
                  <tr key={index}>
                    <td>{point.dateFormatted}</td>
                    <td>{point.duration} days</td>
                    <td>{point.quality}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {/* Visual chart - dynamically loaded */}
            <ShedChartContent data={chartData} />
          </>
        )}

        {/* Quality Legend */}
        {!isPending && !isError && chartData && chartData.length > 0 && (
          <div className="flex justify-center gap-4 mt-4 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded" style={{ backgroundColor: '#22c55e' }} />
              <span>Excellent</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded" style={{ backgroundColor: '#84cc16' }} />
              <span>Good</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded" style={{ backgroundColor: '#f59e0b' }} />
              <span>Fair</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded" style={{ backgroundColor: '#ef4444' }} />
              <span>Poor</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
