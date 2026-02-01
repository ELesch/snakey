'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ReptileIcon } from '@/components/icons/reptile-icon'
import { Plus } from 'lucide-react'

export function EmptyCollectionCTA() {
  return (
    <Card className="col-span-full">
      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
        <div className="mb-4 rounded-full bg-primary-100 p-4">
          <ReptileIcon variant="snake" className="h-12 w-12 text-primary-600" />
        </div>
        <h3 className="mb-2 text-xl font-semibold text-[var(--color-foreground)]">
          Welcome to Snakey!
        </h3>
        <p className="mb-6 max-w-sm text-[var(--color-muted-foreground)]">
          Start tracking your reptile collection by adding your first pet.
          Log feedings, sheds, weights, and more.
        </p>
        <Button asChild>
          <Link href="/reptiles/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Your First Reptile
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}
