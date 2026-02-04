'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { formatDate } from '@/lib/utils'
import { Check, AlertTriangle, Pencil, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Shed } from '@/generated/prisma/client'
import type { OfflineShed } from '@/lib/offline/db'

interface ShedCardProps {
  shed: Shed | OfflineShed
  onEdit: () => void
  onDelete: () => void
  isDeleting: boolean
}

const qualityLabels = {
  COMPLETE: { label: 'Complete', color: 'bg-green-100 text-green-900', icon: Check },
  PARTIAL: { label: 'Partial', color: 'bg-amber-100 text-amber-900', icon: AlertTriangle },
  PROBLEMATIC: { label: 'Stuck Shed', color: 'bg-red-100 text-red-900', icon: AlertTriangle },
}

export function ShedCard({ shed, onEdit, onDelete, isDeleting }: ShedCardProps) {
  const quality = shed.quality as keyof typeof qualityLabels
  const qualityInfo = qualityLabels[quality] || qualityLabels.COMPLETE
  const Icon = qualityInfo.icon
  const shedDate = typeof shed.completedDate === 'number'
    ? new Date(shed.completedDate)
    : new Date(shed.completedDate)

  return (
    <Card className="hover:shadow-sm transition-shadow">
      <CardContent className="py-3 px-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn('px-2 py-1 rounded text-sm font-medium', qualityInfo.color)}>
              <Icon className="h-4 w-4 inline mr-1" aria-hidden="true" />
              {qualityInfo.label}
            </div>
            <p className="text-warm-800 dark:text-warm-200">{formatDate(shedDate)}</p>
            {shed.notes && (
              <p className="text-sm text-warm-700 dark:text-warm-300 max-w-xs truncate hidden sm:block">{shed.notes}</p>
            )}
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" onClick={onEdit} aria-label="Edit shed">
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onDelete}
              disabled={isDeleting}
              aria-label="Delete shed"
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
