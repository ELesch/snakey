'use client'

import dynamic from 'next/dynamic'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useGrowthData } from '@/hooks/use-reports'
import { EmptyState } from '@/components/shared'
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


export function GrowthChart({ filters }: GrowthChartProps) {
  const { growthData, isPending, isError } = useGrowthData(filters)

  // Transform data for chart - format dates
  const chartData = growthData?.map((point) => ({
    ...point,
    dateFormatted: formatChartDate(point.date),
  }))

  // Check if we have any length data
  const hasLengthData = chartData?.some((point) => point.length != null)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Scale className="h-5 w-5" />
          {hasLengthData ? 'Growth (Weight & Length)' : 'Weight Growth'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isPending && <ChartSkeleton />}

        {isError && (
          <div className="h-[300px] flex items-center justify-center text-[var(--color-destructive)]">
            Failed to load growth data
          </div>
        )}

        {!isPending && !isError && (!chartData || chartData.length === 0) && (
          <EmptyState
            icon={<Scale className="h-12 w-12" />}
            title="No growth data recorded"
            description="Add weight or length measurements to track growth"
            withCard={false}
          />
        )}

        {!isPending && !isError && chartData && chartData.length > 0 && (
          <>
            {/* Screen reader accessible data table - always rendered immediately */}
            <table className="sr-only">
              <caption>Growth data over time{hasLengthData ? ' (weight and length)' : ' (weight)'}</caption>
              <thead>
                <tr>
                  <th scope="col">Date</th>
                  <th scope="col">Weight</th>
                  {hasLengthData && <th scope="col">Length</th>}
                </tr>
              </thead>
              <tbody>
                {chartData.map((point, index) => (
                  <tr key={index}>
                    <td>{point.dateFormatted}</td>
                    <td>{point.weight != null ? `${point.weight}g` : '-'}</td>
                    {hasLengthData && <td>{point.length != null ? `${point.length}cm` : '-'}</td>}
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
