// Chart Utility Functions
// Shared helpers for chart components in the reports section

/**
 * Default height for chart containers in pixels
 */
export const CHART_HEIGHT = 300

/**
 * Formats a date string for display in chart axis labels.
 * Uses short month format (e.g., "Jan 15").
 *
 * @param dateString - ISO date string or date-like string
 * @returns Formatted date string (e.g., "Jan 15")
 *
 * @example
 * ```typescript
 * formatChartDate('2024-01-15T00:00:00Z') // Returns "Jan 15"
 * ```
 */
export function formatChartDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

/**
 * Quality levels for shed data visualization
 */
export type ShedQuality = 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR'

/**
 * Color mapping for shed quality visualization
 */
export const SHED_QUALITY_COLORS: Record<ShedQuality, string> = {
  EXCELLENT: '#22c55e', // green
  GOOD: '#84cc16', // lime
  FAIR: '#f59e0b', // amber
  POOR: '#ef4444', // red
} as const

/**
 * Default color for unknown quality values
 */
export const DEFAULT_QUALITY_COLOR = '#6b7280' // gray

/**
 * Returns the color associated with a shed quality level.
 *
 * @param quality - Quality string (case-insensitive)
 * @returns Hex color code for the quality level
 *
 * @example
 * ```typescript
 * getQualityColor('EXCELLENT') // Returns '#22c55e'
 * getQualityColor('excellent') // Returns '#22c55e'
 * getQualityColor('unknown')   // Returns '#6b7280'
 * ```
 */
export function getQualityColor(quality: string): string {
  const normalizedQuality = quality.toUpperCase() as ShedQuality
  return SHED_QUALITY_COLORS[normalizedQuality] ?? DEFAULT_QUALITY_COLOR
}

/**
 * Quality legend items for rendering in chart components
 */
export const QUALITY_LEGEND_ITEMS = [
  { label: 'Excellent', color: SHED_QUALITY_COLORS.EXCELLENT },
  { label: 'Good', color: SHED_QUALITY_COLORS.GOOD },
  { label: 'Fair', color: SHED_QUALITY_COLORS.FAIR },
  { label: 'Poor', color: SHED_QUALITY_COLORS.POOR },
] as const
