'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { useShedStats } from '@/hooks/use-reports'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import { Loader2, Sparkles } from 'lucide-react'
import type { ReportFilters } from '@/services/reports.service'

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
                label={{
                  value: 'Days',
                  angle: -90,
                  position: 'insideLeft',
                  style: { textAnchor: 'middle', fontSize: 12 },
                }}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--color-card)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '8px',
                }}
                labelStyle={{ color: 'var(--color-foreground)' }}
                formatter={(value, name, props) => [
                  `${value} days`,
                  `Quality: ${(props.payload as { quality?: string })?.quality || 'Unknown'}`,
                ]}
              />
              <Bar dataKey="duration" name="Shed Duration" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
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
