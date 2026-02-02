'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { ReptileIcon } from '@/components/icons/reptile-icon'
import { ReptileForm } from './reptile-form'
import type { Reptile } from '@/generated/prisma/client'

interface ReptileCardProps {
  reptile: Reptile
}

function ReptileCard({ reptile }: ReptileCardProps) {
  return (
    <Link href={`/reptiles/${reptile.id}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
        <CardContent className="p-0">
          <div className="aspect-square bg-warm-100 rounded-t-lg overflow-hidden relative">
            <div className="w-full h-full flex items-center justify-center">
              <ReptileIcon variant="snake" className="h-16 w-16 text-warm-300" aria-hidden="true" />
            </div>
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

interface ReptileGridProps {
  reptiles: Reptile[]
}

export function ReptileGrid({ reptiles }: ReptileGridProps) {
  const router = useRouter()

  if (reptiles.length === 0) {
    return (
      <div className="max-w-md mx-auto py-8">
        <div className="text-center mb-6">
          <ReptileIcon variant="snake" className="h-16 w-16 mx-auto mb-4 text-primary-600" aria-hidden="true" />
          <h2 className="text-xl font-semibold text-foreground mb-2">Add Your First Reptile</h2>
          <p className="text-muted-foreground">
            Get started by adding your first reptile to begin tracking their care.
          </p>
        </div>
        <Card>
          <CardContent className="pt-6">
            <ReptileForm
              onSuccess={(reptile) => {
                router.push(`/reptiles/${reptile.id}`)
              }}
            />
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {reptiles.map((reptile) => (
        <ReptileCard key={reptile.id} reptile={reptile} />
      ))}
    </div>
  )
}
