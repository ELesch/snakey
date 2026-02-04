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
  Rectangle,
} from 'recharts'

// Custom cursor that renders a rectangle highlight like bar charts
// Line/Area charts pass offset with chart dimensions, not height directly
interface CursorProps {
  x?: number
  width?: number
  offset?: { top: number; height: number }
}

function CustomCursor(props: CursorProps) {
  const { x, width, offset } = props
  if (x == null || !offset) return null
  return (
    <Rectangle
      x={x}
      y={offset.top}
      width={width || 20}
      height={offset.height}
      fill="var(--color-muted)"
      fillOpacity={0.3}
    />
  )
}

export interface EnvironmentChartDataPoint {
  date: string
  dateFormatted: string
  temperature: number | null
  humidity: number | null
}

interface EnvironmentChartContentProps {
  data: EnvironmentChartDataPoint[]
}

export function EnvironmentChartContent({ data }: EnvironmentChartContentProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart
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
          itemStyle={{ color: 'var(--color-foreground)' }}
          cursor={<CustomCursor />}
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
  )
}
