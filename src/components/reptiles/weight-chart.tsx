'use client'

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import type { Weight } from '@/generated/prisma/client'
import type { OfflineWeight } from '@/lib/offline/db'

interface WeightChartProps {
  weights: (Weight | OfflineWeight)[]
}

interface ChartDataPoint {
  date: string
  dateFormatted: string
  weight: number
}

export function WeightChart({ weights }: WeightChartProps) {
  // Transform and sort data for the chart (oldest first for proper timeline)
  const chartData: ChartDataPoint[] = [...weights]
    .reverse()
    .map((w) => {
      const date = typeof w.date === 'number' ? new Date(w.date) : new Date(w.date)
      return {
        date: date.toISOString(),
        dateFormatted: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        weight: Number(w.weight),
      }
    })

  if (chartData.length < 2) {
    return (
      <div className="h-48 flex items-center justify-center text-warm-400">
        <p>Need at least 2 data points for chart</p>
      </div>
    )
  }

  return (
    <div className="h-48" role="img" aria-label="Weight trend chart">
      <ResponsiveContainer width="100%" height="100%">
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
            domain={['dataMin - 10', 'dataMax + 10']}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'var(--color-card)',
              border: '1px solid var(--color-border)',
              borderRadius: '8px',
            }}
            labelStyle={{ color: 'var(--color-foreground)' }}
            formatter={(value) => [`${value}g`, 'Weight']}
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
    </div>
  )
}
