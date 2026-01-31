import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Edit, Trash2 } from 'lucide-react'

interface ReptileHeaderProps {
  reptileId: string
}

export async function ReptileHeader({ reptileId }: ReptileHeaderProps) {
  // TODO: Fetch reptile data from API or offline DB
  const reptile = {
    id: reptileId,
    name: 'Loading...',
    species: '',
    morph: '',
  }

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/reptiles">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-warm-900">{reptile.name}</h1>
          <p className="text-warm-600">
            {reptile.species}
            {reptile.morph && ` - ${reptile.morph}`}
          </p>
        </div>
      </div>

      <div className="flex gap-2">
        <Button variant="outline" size="sm" asChild>
          <Link href={`/reptiles/${reptileId}/edit`}>
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Link>
        </Button>
        <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
          <Trash2 className="h-4 w-4 mr-2" />
          Delete
        </Button>
      </div>
    </div>
  )
}
