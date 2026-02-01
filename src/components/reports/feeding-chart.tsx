'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { useFeedingStats } from '@/hooks/use-reports'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { Loader2, UtensilsCrossed } from 'lucide-react'
import type { ReportFilters } from '@/services/reports.service'

interface FeedingChartProps {
  filters: ReportFilters
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
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
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={chartData}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-[var(--color-border)]" />
              <XAxis
                dataKey="dateFormatted"
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                className="text-[var(--color-muted-foreground)]"
              />
              <YAxis
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                className="text-[var(--color-muted-foreground)]"
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--color-card)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '8px',
                }}
                labelStyle={{ color: 'var(--color-foreground)' }}
              />
              <Legend />
              <Bar
                dataKey="accepted"
                name="Accepted"
                fill="#22c55e"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="refused"
                name="Refused"
                fill="#f59e0b"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="regurgitated"
                name="Regurgitated"
                fill="#ef4444"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}
