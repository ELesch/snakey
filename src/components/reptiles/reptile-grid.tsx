import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Bug } from 'lucide-react'

interface Reptile {
  id: string
  name: string
  species: string
  morph?: string
  photoUrl?: string
  lastFed?: Date
}

// TODO: Fetch from API or offline DB
const reptiles: Reptile[] = []

export function ReptileGrid() {
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
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {reptiles.map((reptile) => (
        <Link key={reptile.id} href={`/reptiles/${reptile.id}`}>
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-0">
              <div className="aspect-square bg-warm-100 rounded-t-lg overflow-hidden">
                {reptile.photoUrl ? (
                  <img
                    src={reptile.photoUrl}
                    alt={reptile.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Bug className="h-16 w-16 text-warm-300" />
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
      ))}
    </div>
  )
}
