'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { formatDateTime } from '@/lib/utils'
import { Pencil, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { isTemperatureSafe, isHumiditySafe } from '@/lib/species/defaults'
import type { EnvironmentLog } from '@/generated/prisma/client'
import type { OfflineEnvironmentLog } from '@/lib/offline/db'

interface EnvironmentCardProps {
  log: EnvironmentLog | OfflineEnvironmentLog
  species: string
  onEdit: () => void
  onDelete: () => void
  isDeleting: boolean
}

export function EnvironmentCard({ log, species, onEdit, onDelete, isDeleting }: EnvironmentCardProps) {
  const logDate = typeof log.date === 'number' ? new Date(log.date) : new Date(log.date)
  const temp = log.temperature != null ? Number(log.temperature) : null
  const humid = log.humidity != null ? Number(log.humidity) : null

  return (
    <Card className="hover:shadow-sm transition-shadow">
      <CardContent className="py-3 px-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <p className="text-sm text-warm-700 dark:text-warm-300">{formatDateTime(logDate)}</p>
            <div className="flex items-center gap-3">
              {temp !== null && (
                <span className={cn('text-sm', isTemperatureSafe(species, temp, 'hot') ? 'text-warm-700 dark:text-warm-300' : 'text-red-600 font-medium')}>
                  {temp}F
                </span>
              )}
              {humid !== null && (
                <span className={cn('text-sm', isHumiditySafe(species, humid) ? 'text-warm-700 dark:text-warm-300' : 'text-red-600 font-medium')}>
                  {humid}%
                </span>
              )}
              {log.location && <span className="text-sm text-warm-700 dark:text-warm-300">({log.location})</span>}
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" onClick={onEdit} aria-label="Edit reading">
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onDelete}
              disabled={isDeleting}
              aria-label="Delete reading"
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
