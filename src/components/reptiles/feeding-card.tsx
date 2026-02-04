'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { formatDate } from '@/lib/utils'
import { Check, X, Pencil, Trash2 } from 'lucide-react'
import type { Feeding } from '@/generated/prisma/client'
import type { OfflineFeeding } from '@/lib/offline/db'

interface FeedingCardProps {
  feeding: Feeding | OfflineFeeding
  onEdit: () => void
  onDelete: () => void
  isDeleting: boolean
}

export function FeedingCard({ feeding, onEdit, onDelete, isDeleting }: FeedingCardProps) {
  const feedingDate = typeof feeding.date === 'number'
    ? new Date(feeding.date)
    : new Date(feeding.date)

  return (
    <Card className="hover:shadow-sm transition-shadow">
      <CardContent className="py-3 px-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {feeding.accepted ? (
              <div className="p-1.5 bg-green-100 rounded-full">
                <Check className="h-4 w-4 text-green-600" aria-hidden="true" />
                <span className="sr-only">Accepted</span>
              </div>
            ) : (
              <div className="p-1.5 bg-red-100 rounded-full">
                <X className="h-4 w-4 text-red-600" aria-hidden="true" />
                <span className="sr-only">Refused</span>
              </div>
            )}
            <div>
              <p className="font-medium">{feeding.preySize} {feeding.preyType}</p>
              <p className="text-sm text-warm-700 dark:text-warm-300">{formatDate(feedingDate)}</p>
            </div>
            {feeding.notes && (
              <p className="text-sm text-warm-700 dark:text-warm-300 max-w-xs truncate hidden sm:block">{feeding.notes}</p>
            )}
          </div>
          <div className="flex items-center gap-2 md:gap-1">
            <Button variant="ghost" size="sm" onClick={onEdit} aria-label="Edit feeding">
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onDelete}
              disabled={isDeleting}
              aria-label="Delete feeding"
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
