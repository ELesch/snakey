'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useGrowthData } from '@/hooks/use-reports'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { Loader2, Scale } from 'lucide-react'
import type { ReportFilters } from '@/services/reports.service'

interface GrowthChartProps {
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
    dateFormatted: formatDate(point.date),
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
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart
              data={chartData}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="weightGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#8884d8" stopOpacity={0.1} />
                </linearGradient>
              </defs>
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
                tickFormatter={(value) => `${value}g`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--color-card)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '8px',
                }}
                labelStyle={{ color: 'var(--color-foreground)' }}
                formatter={(value, name, props) => [
                  `${value}g`,
                  (props.payload as { reptileName?: string })?.reptileName || 'Weight',
                ]}
              />
              <Area
                type="monotone"
                dataKey="weight"
                stroke="#8884d8"
                fill="url(#weightGradient)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}
