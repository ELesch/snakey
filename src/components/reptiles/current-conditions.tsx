'use client'

import { Thermometer, Droplets } from 'lucide-react'
import { cn } from '@/lib/utils'
import { isTemperatureSafe, isHumiditySafe } from '@/lib/species/defaults'
import type { EnvironmentLog } from '@/generated/prisma/client'
import type { OfflineEnvironmentLog } from '@/lib/offline/db'

interface CurrentConditionsProps {
  log: EnvironmentLog | OfflineEnvironmentLog
  species: string
}

export function CurrentConditions({ log, species }: CurrentConditionsProps) {
  const temp = log.temperature != null ? Number(log.temperature) : null
  const humid = log.humidity != null ? Number(log.humidity) : null

  return (
    <div className="grid grid-cols-2 gap-4">
      {temp !== null && (
        <div className="text-center">
          <Thermometer className="h-6 w-6 mx-auto mb-1 text-red-500" aria-hidden="true" />
          <p className="text-sm text-warm-700">Temperature</p>
          <p className={cn('text-xl font-bold', isTemperatureSafe(species, temp, 'hot') ? 'text-green-600' : 'text-red-600')}>
            {temp}F
          </p>
        </div>
      )}
      {humid !== null && (
        <div className="text-center">
          <Droplets className="h-6 w-6 mx-auto mb-1 text-cyan-500" aria-hidden="true" />
          <p className="text-sm text-warm-700">Humidity</p>
          <p className={cn('text-xl font-bold', isHumiditySafe(species, humid) ? 'text-green-600' : 'text-red-600')}>
            {humid}%
          </p>
        </div>
      )}
    </div>
  )
}
