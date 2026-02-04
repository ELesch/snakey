'use client'

import { useReptiles } from '@/hooks/use-reptiles'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { Calendar, Filter } from 'lucide-react'

interface ReportsHeaderProps {
  reptileId: string
  onReptileChange: (id: string) => void
  startDate: Date
  endDate: Date
  onStartDateChange: (date: Date) => void
  onEndDateChange: (date: Date) => void
}

function formatDateForInput(date: Date): string {
  return date.toISOString().split('T')[0]
}

export function ReportsHeader({
  reptileId,
  onReptileChange,
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
}: ReportsHeaderProps) {
  const { reptiles, isPending } = useReptiles()

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-[var(--color-muted-foreground)]" />
            <span className="text-sm font-medium text-[var(--color-foreground)]">Filters</span>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            {!isPending && reptiles.length > 1 && (
              <div className="flex items-center gap-2">
                <label htmlFor="reptile-filter" className="sr-only">
                  Select Reptile
                </label>
                <Select value={reptileId} onValueChange={onReptileChange}>
                  <SelectTrigger id="reptile-filter" className="w-full sm:w-[180px]">
                    <SelectValue placeholder="All Reptiles" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Reptiles</SelectItem>
                    {reptiles.map((reptile) => (
                      <SelectItem key={reptile.id} value={reptile.id}>
                        {reptile.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <Calendar className="hidden sm:block h-4 w-4 text-[var(--color-muted-foreground)]" />
              <div className="flex items-center gap-2">
                <label htmlFor="start-date" className="text-sm text-[var(--color-muted-foreground)] sm:sr-only">
                  From
                </label>
                <Input
                  id="start-date"
                  type="date"
                  value={formatDateForInput(startDate)}
                  onChange={(e) => onStartDateChange(new Date(e.target.value))}
                  className="flex-1 sm:w-[140px]"
                  aria-label="Start date"
                />
              </div>
              <span className="hidden sm:inline text-[var(--color-muted-foreground)]">to</span>
              <div className="flex items-center gap-2">
                <label htmlFor="end-date" className="text-sm text-[var(--color-muted-foreground)] sm:sr-only">
                  To
                </label>
                <Input
                  id="end-date"
                  type="date"
                  value={formatDateForInput(endDate)}
                  onChange={(e) => onEndDateChange(new Date(e.target.value))}
                  className="flex-1 sm:w-[140px]"
                  aria-label="End date"
                />
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
