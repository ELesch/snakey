'use client'

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
import type { EnvironmentLog } from '@/generated/prisma/client'
import type { OfflineEnvironmentLog } from '@/lib/offline/db'

interface EnvironmentChartProps {
  logs: (EnvironmentLog | OfflineEnvironmentLog)[]
}

interface ChartDataPoint {
  date: string
  dateFormatted: string
  temperature: number | null
  humidity: number | null
}

export function EnvironmentChart({ logs }: EnvironmentChartProps) {
  // Transform and sort data for the chart (oldest first for proper timeline)
  const chartData: ChartDataPoint[] = [...logs]
    .reverse()
    .map((log) => {
      const date = typeof log.date === 'number' ? new Date(log.date) : new Date(log.date)
      return {
        date: date.toISOString(),
        dateFormatted: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        temperature: log.temperature != null ? Number(log.temperature) : null,
        humidity: log.humidity != null ? Number(log.humidity) : null,
      }
    })

  if (chartData.length < 2) {
    return (
      <div className="h-48 flex items-center justify-center text-warm-400">
        <p>Need at least 2 data points for chart</p>
      </div>
    )
  }

  const hasTemperature = chartData.some((d) => d.temperature != null)
  const hasHumidity = chartData.some((d) => d.humidity != null)

  return (
    <div className="h-48" role="img" aria-label="Environment trend chart">
      <ResponsiveContainer width="100%" height="100%">
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
          {hasTemperature && (
            <YAxis
              yAxisId="temp"
              orientation="left"
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              className="text-[var(--color-muted-foreground)]"
              tickFormatter={(value) => `${value}F`}
            />
          )}
          {hasHumidity && (
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
          )}
          <Tooltip
            contentStyle={{
              backgroundColor: 'var(--color-card)',
              border: '1px solid var(--color-border)',
              borderRadius: '8px',
            }}
            labelStyle={{ color: 'var(--color-foreground)' }}
            formatter={(value, name) => {
              if (name === 'temperature') return [`${value}F`, 'Temperature']
              if (name === 'humidity') return [`${value}%`, 'Humidity']
              return [value, name]
            }}
          />
          <Legend />
          {hasTemperature && (
            <Line
              yAxisId="temp"
              type="monotone"
              dataKey="temperature"
              stroke="#ef4444"
              strokeWidth={2}
              dot={false}
              connectNulls
              name="Temperature"
            />
          )}
          {hasHumidity && (
            <Line
              yAxisId={hasTemperature ? 'humidity' : 'temp'}
              type="monotone"
              dataKey="humidity"
              stroke="#06b6d4"
              strokeWidth={2}
              dot={false}
              connectNulls
              name="Humidity"
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
