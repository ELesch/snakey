'use client'

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

export interface ShedChartDataPoint {
  date: string
  dateFormatted: string
  duration: number
  quality: string
  color: string
}

interface ShedChartContentProps {
  data: ShedChartDataPoint[]
}

export function ShedChartContent({ data }: ShedChartContentProps) {
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
          itemStyle={{ color: 'var(--color-foreground)' }}
          formatter={(value, name, props) => [
            `${value} days`,
            `Quality: ${(props.payload as { quality?: string })?.quality || 'Unknown'}`,
          ]}
        />
        <Bar dataKey="duration" name="Shed Duration" radius={[4, 4, 0, 0]}>
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
