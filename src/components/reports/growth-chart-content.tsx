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
  Legend,
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
  weight: number | null
  length?: number | null
  reptileName?: string
}

interface GrowthChartContentProps {
  data: GrowthChartDataPoint[]
}

export function GrowthChartContent({ data }: GrowthChartContentProps) {
  // Check if any data has length measurements
  const hasLengthData = data.some((point) => point.length != null)

  return (
    <ResponsiveContainer width="100%" height={300} aria-hidden="true">
      <AreaChart
        data={data}
        margin={{ top: 10, right: hasLengthData ? 10 : 10, left: 0, bottom: 0 }}
      >
        <defs>
          <linearGradient id="weightGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
            <stop offset="95%" stopColor="#8884d8" stopOpacity={0.1} />
          </linearGradient>
          <linearGradient id="lengthGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8} />
            <stop offset="95%" stopColor="#82ca9d" stopOpacity={0.1} />
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
          yAxisId="weight"
          tick={{ fontSize: 12 }}
          tickLine={false}
          axisLine={false}
          className="text-[var(--color-muted-foreground)]"
          tickFormatter={(value) => `${value}g`}
        />
        {hasLengthData && (
          <YAxis
            yAxisId="length"
            orientation="right"
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            className="text-[var(--color-muted-foreground)]"
            tickFormatter={(value) => `${value}cm`}
          />
        )}
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
            if (value == null) return ['-', name]
            if (name === 'Weight') return [`${value}g`, name]
            if (name === 'Length') return [`${value}cm`, name]
            return [String(value), name]
          }}
        />
        {hasLengthData && <Legend />}
        <Area
          yAxisId="weight"
          type="monotone"
          dataKey="weight"
          name="Weight"
          stroke="#8884d8"
          fill="url(#weightGradient)"
          strokeWidth={2}
          connectNulls
        />
        {hasLengthData && (
          <Area
            yAxisId="length"
            type="monotone"
            dataKey="length"
            name="Length"
            stroke="#82ca9d"
            fill="url(#lengthGradient)"
            strokeWidth={2}
            connectNulls
          />
        )}
      </AreaChart>
    </ResponsiveContainer>
  )
}
