'use client'

import { useState, useMemo } from 'react'
import { useReptiles } from '@/hooks/use-reptiles'
import { getChartsForSpecies } from '@/lib/species/charts'
import { ReportsHeader } from '@/components/reports/reports-header'
import { SummaryStats } from '@/components/reports/summary-stats'
import { GrowthChart } from '@/components/reports/growth-chart'
import { FeedingChart } from '@/components/reports/feeding-chart'
import { ShedChart } from '@/components/reports/shed-chart'
import { EnvironmentChart } from '@/components/reports/environment-chart'
import type { ReportFilters } from '@/services/reports.service'

// Default to last 90 days
function getDefaultDateRange(): { startDate: Date; endDate: Date } {
  const endDate = new Date()
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - 90)
  return { startDate, endDate }
}

export default function ReportsPage() {
  const defaultRange = useMemo(() => getDefaultDateRange(), [])

  const [reptileId, setReptileId] = useState<string>('all')
  const [startDate, setStartDate] = useState<Date>(defaultRange.startDate)
  const [endDate, setEndDate] = useState<Date>(defaultRange.endDate)

  const { reptiles } = useReptiles()

  // Get the selected reptile's species (if a specific reptile is selected)
  const selectedSpecies = useMemo(() => {
    if (reptileId === 'all') {
      return undefined
    }
    const selectedReptile = reptiles.find((r) => r.id === reptileId)
    return selectedReptile?.species
  }, [reptileId, reptiles])

  // Determine which charts to show based on species
  const visibleCharts = useMemo(
    () => getChartsForSpecies(selectedSpecies),
    [selectedSpecies]
  )

  const filters: ReportFilters = useMemo(
    () => ({
      reptileId: reptileId !== 'all' ? reptileId : undefined,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    }),
    [reptileId, startDate, endDate]
  )

  // Helper to check if a chart type should be shown
  const showChart = (chartType: 'feeding' | 'growth' | 'shedding' | 'environment') =>
    visibleCharts.includes(chartType)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-foreground)]">Reports</h1>
        <p className="text-[var(--color-muted-foreground)]">
          Analytics and insights for your reptile collection
        </p>
      </div>

      <ReportsHeader
        reptileId={reptileId}
        onReptileChange={setReptileId}
        startDate={startDate}
        endDate={endDate}
        onStartDateChange={setStartDate}
        onEndDateChange={setEndDate}
      />

      <SummaryStats />

      {/* Charts rendered in order: Feeding, Growth, Shedding (if applicable), Environment */}
      <div className="grid gap-6 lg:grid-cols-2">
        {showChart('feeding') && <FeedingChart filters={filters} />}
        {showChart('growth') && <GrowthChart filters={filters} />}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {showChart('shedding') && <ShedChart filters={filters} />}
        {showChart('environment') && <EnvironmentChart filters={filters} />}
      </div>
    </div>
  )
}
