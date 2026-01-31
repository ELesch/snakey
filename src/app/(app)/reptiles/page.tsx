import { Suspense } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ReptileGrid } from '@/components/reptiles/reptile-grid'
import { ReptileGridSkeleton } from '@/components/reptiles/reptile-grid-skeleton'

export default function ReptilesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-warm-900">My Reptiles</h1>
          <p className="text-warm-600">Manage your reptile collection</p>
        </div>
        <Button asChild>
          <Link href="/reptiles/new">Add Reptile</Link>
        </Button>
      </div>

      <Suspense fallback={<ReptileGridSkeleton />}>
        <ReptileGrid />
      </Suspense>
    </div>
  )
}
