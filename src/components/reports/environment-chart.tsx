'use client'

import dynamic from 'next/dynamic'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { useEnvironmentStats } from '@/hooks/use-reports'
import { Loader2, Thermometer } from 'lucide-react'
import type { ReportFilters } from '@/services/reports.service'
import { formatChartDate } from './chart-utils'

// Dynamic import for chart content - only loaded when component mounts
const EnvironmentChartContent = dynamic(
  () => import('./environment-chart-content').then((mod) => mod.EnvironmentChartContent),
  {
    loading: () => <ChartLoadingSkeleton />,
    ssr: false, // Charts don't need server rendering
  }
)

interface EnvironmentChartProps {
  filters: ReportFilters
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
      <Thermometer className="h-12 w-12 mb-2 opacity-50" />
      <p className="text-sm">No environment data recorded</p>
      <p className="text-xs">Log temperature and humidity readings</p>
    </div>
  )
}

export function EnvironmentChart({ filters }: EnvironmentChartProps) {
  const { environmentData, environmentSummary, isPending, isError } = useEnvironmentStats(filters)

  // Transform data for chart - format dates
  const chartData = environmentData?.map((point) => ({
    ...point,
    dateFormatted: formatChartDate(point.date),
  }))

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Thermometer className="h-5 w-5" />
          Environment Conditions
        </CardTitle>
        {environmentSummary && (
          <CardDescription>
            Avg temp: {environmentSummary.avgTemp.toFixed(1)}F ({environmentSummary.tempRange.min}-
            {environmentSummary.tempRange.max}F) | Avg humidity: {environmentSummary.avgHumidity.toFixed(1)}% (
            {environmentSummary.humidityRange.min}-{environmentSummary.humidityRange.max}%)
          </CardDescription>
        )}
      </CardHeader>
      <CardContent>
        {isPending && <ChartSkeleton />}

        {isError && (
          <div className="h-[300px] flex items-center justify-center text-[var(--color-destructive)]">
            Failed to load environment data
          </div>
        )}

        {!isPending && !isError && (!chartData || chartData.length === 0) && <EmptyState />}

        {!isPending && !isError && chartData && chartData.length > 0 && (
          <EnvironmentChartContent data={chartData} />
        )}
      </CardContent>
    </Card>
  )
}
