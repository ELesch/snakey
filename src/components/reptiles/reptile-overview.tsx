'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDate, daysSince } from '@/lib/utils'
import { getSpeciesConfig } from '@/lib/species/defaults'
import {
  getTemperatureRange,
  getHumidityRange,
  getFeedingScheduleMessage,
} from '@/lib/species/config'
import { useFeedings, useSheds } from '@/hooks'
import type { Reptile } from '@/generated/prisma/client'

interface ReptileOverviewProps {
  reptileId: string
  reptile: Reptile
}

export function ReptileOverview({ reptileId, reptile }: ReptileOverviewProps) {
  const { feedings } = useFeedings(reptileId)
  const { sheds } = useSheds(reptileId)

  const speciesConfig = getSpeciesConfig(reptile.species)

  // Get most recent records
  const lastFeeding = feedings[0]
  const lastShed = sheds[0]

  // Parse dates for offline records (timestamps) vs API records (Date strings)
  const parseDate = (value: Date | number | string | undefined): Date | null => {
    if (!value) return null
    if (typeof value === 'number') return new Date(value)
    return new Date(value)
  }

  const lastFedDate = lastFeeding ? parseDate(lastFeeding.date) : null
  const lastShedDate = lastShed ? parseDate(lastShed.completedDate) : null

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quick Stats</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:justify-between gap-0.5 sm:gap-2">
              <dt className="text-warm-700 dark:text-warm-300 flex-shrink-0">Last Fed</dt>
              <dd className="font-medium text-right sm:text-right">
                {lastFedDate ? (
                  <>
                    {formatDate(lastFedDate)} ({daysSince(lastFedDate)} days ago)
                  </>
                ) : (
                  <span className="text-warm-400">No feeding records</span>
                )}
              </dd>
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-between gap-0.5 sm:gap-2">
              <dt className="text-warm-700 dark:text-warm-300 flex-shrink-0">Last Shed</dt>
              <dd className="font-medium text-right sm:text-right">
                {lastShedDate ? (
                  <>
                    {formatDate(lastShedDate)} ({daysSince(lastShedDate)} days ago)
                  </>
                ) : (
                  <span className="text-warm-400">No shed records</span>
                )}
              </dd>
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-between gap-0.5 sm:gap-2">
              <dt className="text-warm-700 dark:text-warm-300 flex-shrink-0">Sex</dt>
              <dd className="font-medium capitalize text-right sm:text-right">
                {reptile.sex?.toLowerCase() || 'Unknown'}
              </dd>
            </div>
            {reptile.birthDate && (
              <div className="flex flex-col sm:flex-row sm:justify-between gap-0.5 sm:gap-2">
                <dt className="text-warm-700 dark:text-warm-300 flex-shrink-0">Birth Date</dt>
                <dd className="font-medium text-right sm:text-right">
                  {formatDate(parseDate(reptile.birthDate)!)}
                </dd>
              </div>
            )}
            <div className="flex flex-col sm:flex-row sm:justify-between gap-0.5 sm:gap-2">
              <dt className="text-warm-700 dark:text-warm-300 flex-shrink-0">Acquired</dt>
              <dd className="font-medium text-right sm:text-right">
                {formatDate(parseDate(reptile.acquisitionDate)!)}
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      {speciesConfig && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Species Care Guidelines</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:justify-between gap-0.5 sm:gap-2">
                <dt className="text-warm-700 dark:text-warm-300 flex-shrink-0">Hot Side</dt>
                <dd className="font-medium text-right sm:text-right">
                  {getTemperatureRange(
                    speciesConfig.tempHotMin,
                    speciesConfig.tempHotMax
                  )}
                </dd>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between gap-0.5 sm:gap-2">
                <dt className="text-warm-700 dark:text-warm-300 flex-shrink-0">Cool Side</dt>
                <dd className="font-medium text-right sm:text-right">
                  {getTemperatureRange(
                    speciesConfig.tempCoolMin,
                    speciesConfig.tempCoolMax
                  )}
                </dd>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between gap-0.5 sm:gap-2">
                <dt className="text-warm-700 dark:text-warm-300 flex-shrink-0">Humidity</dt>
                <dd className="font-medium text-right sm:text-right">
                  {getHumidityRange(
                    speciesConfig.humidityMin,
                    speciesConfig.humidityMax
                  )}
                </dd>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between gap-0.5 sm:gap-2">
                <dt className="text-warm-700 dark:text-warm-300 flex-shrink-0">Feeding</dt>
                <dd className="font-medium text-right sm:text-right">
                  {getFeedingScheduleMessage(speciesConfig.feedingInterval)}
                </dd>
              </div>
            </dl>
            {speciesConfig.notes && (
              <p className="mt-4 text-sm text-warm-700 dark:text-warm-300 bg-warm-50 dark:bg-warm-900 p-3 rounded">
                {speciesConfig.notes}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {reptile.notes && (
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-warm-700 dark:text-warm-300 whitespace-pre-wrap">{reptile.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
