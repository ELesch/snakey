import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDate, daysSince } from '@/lib/utils'
import { getSpeciesConfig } from '@/lib/species/defaults'
import { getTemperatureRange, getHumidityRange, getFeedingScheduleMessage } from '@/lib/species/config'

interface ReptileOverviewProps {
  reptileId: string
}

export async function ReptileOverview({ reptileId }: ReptileOverviewProps) {
  // TODO: Fetch from API or offline DB
  const reptile = {
    id: reptileId,
    species: 'ball_python',
    lastFed: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    lastShed: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
    lastWeight: { weight: 450, date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
  }

  const speciesConfig = getSpeciesConfig(reptile.species)

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quick Stats</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="space-y-4">
            <div className="flex justify-between">
              <dt className="text-warm-600">Last Fed</dt>
              <dd className="font-medium">
                {formatDate(reptile.lastFed)} ({daysSince(reptile.lastFed)} days ago)
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-warm-600">Last Shed</dt>
              <dd className="font-medium">
                {formatDate(reptile.lastShed)} ({daysSince(reptile.lastShed)} days ago)
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-warm-600">Last Weight</dt>
              <dd className="font-medium">
                {reptile.lastWeight.weight}g ({formatDate(reptile.lastWeight.date)})
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
              <div className="flex justify-between">
                <dt className="text-warm-600">Hot Side</dt>
                <dd className="font-medium">
                  {getTemperatureRange(speciesConfig.tempHotMin, speciesConfig.tempHotMax)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-warm-600">Cool Side</dt>
                <dd className="font-medium">
                  {getTemperatureRange(speciesConfig.tempCoolMin, speciesConfig.tempCoolMax)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-warm-600">Humidity</dt>
                <dd className="font-medium">
                  {getHumidityRange(speciesConfig.humidityMin, speciesConfig.humidityMax)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-warm-600">Feeding</dt>
                <dd className="font-medium">
                  {getFeedingScheduleMessage(speciesConfig.feedingInterval)}
                </dd>
              </div>
            </dl>
            {speciesConfig.notes && (
              <p className="mt-4 text-sm text-warm-600 bg-warm-50 p-3 rounded">
                {speciesConfig.notes}
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
