'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDateTime } from '@/lib/utils'
import { Plus, Thermometer, Droplets } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getSpeciesConfig, isTemperatureSafe, isHumiditySafe } from '@/lib/species/defaults'

interface EnvironmentLog {
  id: string
  timestamp: Date
  tempHot: number
  tempCool: number
  humidity: number
  notes?: string
}

interface EnvironmentHistoryProps {
  reptileId: string
}

export function EnvironmentHistory({ reptileId }: EnvironmentHistoryProps) {
  const [showForm, setShowForm] = useState(false)

  // TODO: Fetch from API or offline DB
  const logs: EnvironmentLog[] = []
  const species = 'ball_python' // TODO: Get from reptile data
  const speciesConfig = getSpeciesConfig(species)

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Environment History</h3>
        <Button onClick={() => setShowForm(true)} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Log Reading
        </Button>
      </div>

      {/* Current conditions card */}
      {logs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Current Conditions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <Thermometer className="h-6 w-6 mx-auto mb-1 text-red-500" />
                <p className="text-sm text-warm-500">Hot Side</p>
                <p
                  className={cn(
                    'text-xl font-bold',
                    isTemperatureSafe(species, logs[0].tempHot, 'hot')
                      ? 'text-green-600'
                      : 'text-red-600'
                  )}
                >
                  {logs[0].tempHot}°F
                </p>
              </div>
              <div className="text-center">
                <Thermometer className="h-6 w-6 mx-auto mb-1 text-blue-500" />
                <p className="text-sm text-warm-500">Cool Side</p>
                <p
                  className={cn(
                    'text-xl font-bold',
                    isTemperatureSafe(species, logs[0].tempCool, 'cool')
                      ? 'text-green-600'
                      : 'text-red-600'
                  )}
                >
                  {logs[0].tempCool}°F
                </p>
              </div>
              <div className="text-center">
                <Droplets className="h-6 w-6 mx-auto mb-1 text-cyan-500" />
                <p className="text-sm text-warm-500">Humidity</p>
                <p
                  className={cn(
                    'text-xl font-bold',
                    isHumiditySafe(species, logs[0].humidity)
                      ? 'text-green-600'
                      : 'text-red-600'
                  )}
                >
                  {logs[0].humidity}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* TODO: Environment chart component */}
      {logs.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48 flex items-center justify-center text-warm-400">
              {/* TODO: Recharts line chart */}
              <p>Environment chart will appear here</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* TODO: Environment form modal */}

      {logs.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Thermometer className="h-12 w-12 mx-auto mb-4 text-warm-300" />
            <p className="text-warm-600">No environment readings yet</p>
            <p className="text-sm text-warm-500">Click &quot;Log Reading&quot; to add one</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {logs.map((log) => (
            <Card key={log.id}>
              <CardContent className="py-3 px-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <p className="text-sm text-warm-500">
                      {formatDateTime(log.timestamp)}
                    </p>
                    <div className="flex items-center gap-3">
                      <span
                        className={cn(
                          'text-sm',
                          isTemperatureSafe(species, log.tempHot, 'hot')
                            ? 'text-warm-700'
                            : 'text-red-600 font-medium'
                        )}
                      >
                        Hot: {log.tempHot}°F
                      </span>
                      <span
                        className={cn(
                          'text-sm',
                          isTemperatureSafe(species, log.tempCool, 'cool')
                            ? 'text-warm-700'
                            : 'text-red-600 font-medium'
                        )}
                      >
                        Cool: {log.tempCool}°F
                      </span>
                      <span
                        className={cn(
                          'text-sm',
                          isHumiditySafe(species, log.humidity)
                            ? 'text-warm-700'
                            : 'text-red-600 font-medium'
                        )}
                      >
                        Humidity: {log.humidity}%
                      </span>
                    </div>
                  </div>
                  {log.notes && (
                    <p className="text-sm text-warm-600 max-w-xs truncate">
                      {log.notes}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
