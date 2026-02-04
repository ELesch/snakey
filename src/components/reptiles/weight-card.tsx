'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { formatDate } from '@/lib/utils'
import { TrendingUp, TrendingDown, Minus, Pencil, Trash2 } from 'lucide-react'
import type { Weight } from '@/generated/prisma/client'
import type { OfflineWeight } from '@/lib/offline/db'

interface WeightCardProps {
  weight: Weight | OfflineWeight
  trend: 'up' | 'down' | 'stable' | null
  onEdit: () => void
  onDelete: () => void
  isDeleting: boolean
}

export function WeightCard({ weight, trend, onEdit, onDelete, isDeleting }: WeightCardProps) {
  const weightDate = typeof weight.date === 'number' ? new Date(weight.date) : new Date(weight.date)

  return (
    <Card className="hover:shadow-sm transition-shadow">
      <CardContent className="py-3 px-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <span className="text-lg font-semibold">{Number(weight.weight)}g</span>
              {trend === 'up' && <TrendingUp className="h-4 w-4 text-green-600" aria-label="Gaining" />}
              {trend === 'down' && <TrendingDown className="h-4 w-4 text-red-600" aria-label="Losing" />}
              {trend === 'stable' && <Minus className="h-4 w-4 text-warm-400" aria-label="Stable" />}
            </div>
            <p className="text-warm-700 dark:text-warm-300">{formatDate(weightDate)}</p>
            {weight.notes && (
              <p className="text-sm text-warm-700 dark:text-warm-300 max-w-xs truncate hidden sm:block">{weight.notes}</p>
            )}
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" onClick={onEdit} aria-label="Edit weight">
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onDelete}
              disabled={isDeleting}
              aria-label="Delete weight"
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
