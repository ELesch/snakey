'use client'

import dynamic from 'next/dynamic'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useGrowthData } from '@/hooks/use-reports'
import { Loader2, Scale } from 'lucide-react'
import type { ReportFilters } from '@/services/reports.service'
import { formatChartDate } from './chart-utils'

// Dynamic import for chart content - only loaded when component mounts
const GrowthChartContent = dynamic(
  () => import('./growth-chart-content').then((mod) => mod.GrowthChartContent),
  {
    loading: () => <ChartLoadingSkeleton />,
    ssr: false, // Charts don't need server rendering
  }
)

interface GrowthChartProps {
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
      <Scale className="h-12 w-12 mb-2 opacity-50" />
      <p className="text-sm">No weight data recorded</p>
      <p className="text-xs">Add weight measurements to track growth</p>
    </div>
  )
}

export function GrowthChart({ filters }: GrowthChartProps) {
  const { growthData, isPending, isError } = useGrowthData(filters)

  // Transform data for chart - format dates
  const chartData = growthData?.map((point) => ({
    ...point,
    dateFormatted: formatChartDate(point.date),
  }))

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Scale className="h-5 w-5" />
          Weight Growth
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isPending && <ChartSkeleton />}

        {isError && (
          <div className="h-[300px] flex items-center justify-center text-[var(--color-destructive)]">
            Failed to load growth data
          </div>
        )}

        {!isPending && !isError && (!chartData || chartData.length === 0) && <EmptyState />}

        {!isPending && !isError && chartData && chartData.length > 0 && (
          <>
            {/* Screen reader accessible data table - always rendered immediately */}
            <table className="sr-only">
              <caption>Weight growth data over time</caption>
              <thead>
                <tr>
                  <th scope="col">Date</th>
                  <th scope="col">Weight</th>
                </tr>
              </thead>
              <tbody>
                {chartData.map((point, index) => (
                  <tr key={index}>
                    <td>{point.dateFormatted}</td>
                    <td>{point.weight}g</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {/* Visual chart - dynamically loaded */}
            <GrowthChartContent data={chartData} />
          </>
        )}
      </CardContent>
    </Card>
  )
}
