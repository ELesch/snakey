'use client'

import { memo, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDate } from '@/lib/utils'
import { ClutchList } from './clutch-list'
import { Heart, Check, X, ChevronDown, ChevronUp, Trash2, Edit } from 'lucide-react'
import type { Pairing, Reptile } from '@/generated/prisma/client'

type PairingWithRelations = Pairing & {
  male?: Reptile
  female?: Reptile
}

interface PairingCardProps {
  pairing: PairingWithRelations
  isExpanded: boolean
  onToggleExpand: () => void
  onEdit: () => void
  onDelete: () => void
  isDeletePending: boolean
}

export const PairingCard = memo(function PairingCard({
  pairing,
  isExpanded,
  onToggleExpand,
  onEdit,
  onDelete,
  isDeletePending,
}: PairingCardProps) {
  const pairingLabel = useMemo(
    () => `${pairing.male?.name ?? 'Male'} x ${pairing.female?.name ?? 'Female'}`,
    [pairing.male?.name, pairing.female?.name]
  )

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-base flex items-center gap-2 min-w-0">
            <Heart className="h-4 w-4 text-primary-500 shrink-0" />
            <span className="truncate">{pairingLabel}</span>
          </CardTitle>
          <div className="flex items-center gap-2">
            {pairing.successful !== null && (
              <span
                className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full ${
                  pairing.successful
                    ? 'bg-green-100 text-green-900'
                    : 'bg-red-100 text-red-900'
                }`}
              >
                {pairing.successful ? (
                  <Check className="h-3 w-3" />
                ) : (
                  <X className="h-3 w-3" />
                )}
                {pairing.successful ? 'Successful' : 'Unsuccessful'}
              </span>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={onEdit}
              aria-label={`Edit pairing ${pairingLabel}`}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onDelete}
              disabled={isDeletePending}
              aria-label={`Delete pairing ${pairingLabel}`}
            >
              <Trash2 className="h-4 w-4 text-red-500" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="text-sm text-warm-800 mb-3">
          <span>Started: {formatDate(pairing.startDate)}</span>
          {pairing.endDate && (
            <span className="ml-4">Ended: {formatDate(pairing.endDate)}</span>
          )}
        </div>
        {pairing.notes && (
          <p className="text-sm text-warm-700 mb-3">{pairing.notes}</p>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleExpand}
          className="w-full justify-center"
        >
          {isExpanded ? (
            <>
              <ChevronUp className="h-4 w-4 mr-2" />
              Hide Clutches
            </>
          ) : (
            <>
              <ChevronDown className="h-4 w-4 mr-2" />
              Show Clutches
            </>
          )}
        </Button>
        {isExpanded && (
          <div className="mt-4 pt-4 border-t border-warm-200">
            <ClutchList pairingId={pairing.id} />
          </div>
        )}
      </CardContent>
    </Card>
  )
})
