'use client'

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
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

export interface GrowthChartDataPoint {
  date: string
  dateFormatted: string
  weight: number
  reptileName?: string
}

interface GrowthChartContentProps {
  data: GrowthChartDataPoint[]
}

export function GrowthChartContent({ data }: GrowthChartContentProps) {
  return (
    <ResponsiveContainer width="100%" height={300} aria-hidden="true">
      <AreaChart
        data={data}
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
          itemStyle={{ color: 'var(--color-foreground)' }}
          cursor={<CustomCursor />}
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
  )
}
