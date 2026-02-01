'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { useEnvironmentStats } from '@/hooks/use-reports'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { Loader2, Thermometer } from 'lucide-react'
import type { ReportFilters } from '@/services/reports.service'

interface EnvironmentChartProps {
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
    dateFormatted: formatDate(point.date),
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
          <ResponsiveContainer width="100%" height={300}>
            <LineChart
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
                yAxisId="temp"
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                className="text-[var(--color-muted-foreground)]"
                tickFormatter={(value) => `${value}F`}
                domain={['dataMin - 5', 'dataMax + 5']}
              />
              <YAxis
                yAxisId="humidity"
                orientation="right"
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                className="text-[var(--color-muted-foreground)]"
                tickFormatter={(value) => `${value}%`}
                domain={[0, 100]}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--color-card)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '8px',
                }}
                labelStyle={{ color: 'var(--color-foreground)' }}
                formatter={(value, name) => {
                  if (typeof value !== 'number') return [String(value), name]
                  if (name === 'Temperature') return [`${value}F`, name]
                  if (name === 'Humidity') return [`${value}%`, name]
                  return [String(value), name]
                }}
              />
              <Legend />
              <Line
                yAxisId="temp"
                type="monotone"
                dataKey="temperature"
                name="Temperature"
                stroke="#ef4444"
                strokeWidth={2}
                dot={{ fill: '#ef4444', strokeWidth: 0, r: 3 }}
                activeDot={{ r: 5, strokeWidth: 0 }}
                connectNulls
              />
              <Line
                yAxisId="humidity"
                type="monotone"
                dataKey="humidity"
                name="Humidity"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ fill: '#3b82f6', strokeWidth: 0, r: 3 }}
                activeDot={{ r: 5, strokeWidth: 0 }}
                connectNulls
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}
