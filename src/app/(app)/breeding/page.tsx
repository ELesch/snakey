import { Suspense } from 'react'
import { PairingList } from '@/components/breeding/pairing-list'
import { Card, CardContent } from '@/components/ui/card'

function PairingListSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <Card key={i} className="animate-pulse">
          <CardContent className="py-6">
            <div className="h-4 bg-warm-200 rounded w-1/3 mb-2" />
            <div className="h-3 bg-warm-100 rounded w-1/2" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export default function BreedingPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-warm-900">Breeding Records</h1>
        <p className="text-warm-700">Track pairings, clutches, and hatchlings</p>
      </div>

      <Suspense fallback={<PairingListSkeleton />}>
        <PairingList />
      </Suspense>
    </div>
  )
}
