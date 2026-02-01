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
                  {!isPending &&
                    reptiles.map((reptile) => (
                      <SelectItem key={reptile.id} value={reptile.id}>
                        {reptile.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-[var(--color-muted-foreground)]" />
              <label htmlFor="start-date" className="sr-only">
                Start Date
              </label>
              <Input
                id="start-date"
                type="date"
                value={formatDateForInput(startDate)}
                onChange={(e) => onStartDateChange(new Date(e.target.value))}
                className="w-full sm:w-[140px]"
                aria-label="Start date"
              />
              <span className="text-[var(--color-muted-foreground)]">to</span>
              <label htmlFor="end-date" className="sr-only">
                End Date
              </label>
              <Input
                id="end-date"
                type="date"
                value={formatDateForInput(endDate)}
                onChange={(e) => onEndDateChange(new Date(e.target.value))}
                className="w-full sm:w-[140px]"
                aria-label="End date"
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
