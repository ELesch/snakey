'use client'

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

export interface FeedingChartDataPoint {
  date: string
  dateFormatted: string
  accepted: number
  refused: number
  regurgitated: number
}

interface FeedingChartContentProps {
  data: FeedingChartDataPoint[]
}

export function FeedingChartContent({ data }: FeedingChartContentProps) {
  return (
    <ResponsiveContainer width="100%" height={300} aria-hidden="true">
      <BarChart
        data={data}
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
          itemStyle={{ color: 'var(--color-foreground)' }}
          cursor={{ fill: 'var(--color-muted)', fillOpacity: 0.3 }}
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
  )
}
