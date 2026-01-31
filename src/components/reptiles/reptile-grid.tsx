'use client'

import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Bug, WifiOff, AlertCircle } from 'lucide-react'
import { useReptiles } from '@/hooks'
import { ReptileGridSkeleton } from './reptile-grid-skeleton'
import type { Reptile } from '@/generated/prisma/client'
import type { OfflineReptile } from '@/lib/offline/db'

type ReptileItem = Reptile | OfflineReptile

function isOfflineReptile(reptile: ReptileItem): reptile is OfflineReptile {
  return '_syncStatus' in reptile
}

interface ReptileCardProps {
  reptile: ReptileItem
}

function ReptileCard({ reptile }: ReptileCardProps) {
  const isPending = isOfflineReptile(reptile) && reptile._syncStatus === 'pending'

  return (
    <Link href={`/reptiles/${reptile.id}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
        <CardContent className="p-0">
          <div className="aspect-square bg-warm-100 rounded-t-lg overflow-hidden relative">
            <div className="w-full h-full flex items-center justify-center">
              <Bug className="h-16 w-16 text-warm-300" />
            </div>
            {isPending && (
              <div className="absolute top-2 right-2 bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full flex items-center gap-1">
                <WifiOff className="h-3 w-3" />
                Pending sync
              </div>
            )}
          </div>
          <div className="p-4">
            <h3 className="font-semibold text-warm-900">{reptile.name}</h3>
            <p className="text-sm text-warm-600">{reptile.species}</p>
            {reptile.morph && (
              <p className="text-xs text-warm-500">{reptile.morph}</p>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

export function ReptileGrid() {
  const { reptiles, isPending, isError, error, isOnline, isOfflineData } = useReptiles()

  if (isPending) {
    return <ReptileGridSkeleton />
  }

  if (isError && !isOfflineData) {
    return (
      <div className="text-center py-16">
        <AlertCircle className="h-16 w-16 mx-auto mb-4 text-red-400" />
        <h3 className="text-lg font-medium text-warm-900 mb-2">
          Failed to load reptiles
        </h3>
        <p className="text-warm-600 mb-4">
          {error?.message || 'An unexpected error occurred'}
        </p>
      </div>
    )
  }

  if (reptiles.length === 0) {
    return (
      <div className="text-center py-16">
        <Bug className="h-16 w-16 mx-auto mb-4 text-warm-300" />
        <h3 className="text-lg font-medium text-warm-900 mb-2">No reptiles yet</h3>
        <p className="text-warm-600 mb-4">
          Add your first reptile to start tracking their care.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {isOfflineData && !isOnline && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-center gap-2 text-sm text-yellow-800">
          <WifiOff className="h-4 w-4 flex-shrink-0" />
          <span>Showing offline data. Changes will sync when you are back online.</span>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {reptiles.map((reptile) => (
          <ReptileCard key={reptile.id} reptile={reptile} />
        ))}
      </div>
    </div>
  )
}
