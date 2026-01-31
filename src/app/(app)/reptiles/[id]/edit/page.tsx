'use client'

import { use, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { notFound } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ReptileForm } from '@/components/reptiles/reptile-form'
import { useReptile } from '@/hooks'
import { Loader2 } from 'lucide-react'
import type { Reptile } from '@/generated/prisma/client'
import type { OfflineReptile } from '@/lib/offline/db'

interface EditReptilePageProps {
  params: Promise<{ id: string }>
}

// Convert offline reptile to format compatible with form
function normalizeReptileForForm(
  reptile: Reptile | OfflineReptile
): Partial<Reptile> {
  const isOffline = '_syncStatus' in reptile

  if (isOffline) {
    const offline = reptile as OfflineReptile
    return {
      id: offline.id,
      userId: offline.userId,
      name: offline.name,
      species: offline.species,
      morph: offline.morph ?? null,
      sex: offline.sex,
      birthDate: offline.birthDate ? new Date(offline.birthDate) : null,
      acquisitionDate: new Date(offline.acquisitionDate),
      currentWeight: offline.currentWeight != null ? offline.currentWeight as unknown as import('@/generated/prisma/client').Prisma.Decimal : null,
      notes: offline.notes ?? null,
      isPublic: offline.isPublic,
    }
  }

  return reptile
}

export default function EditReptilePage({ params }: EditReptilePageProps) {
  const { id } = use(params)
  const router = useRouter()
  const { reptile, isPending, isError } = useReptile(id)

  const normalizedReptile = useMemo(() => {
    if (!reptile) return undefined
    return normalizeReptileForForm(reptile)
  }, [reptile])

  if (!id) {
    notFound()
  }

  const handleSuccess = (updatedReptile: Reptile) => {
    router.push(`/reptiles/${updatedReptile.id}`)
  }

  const handleCancel = () => {
    router.push(`/reptiles/${id}`)
  }

  if (isPending) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Edit Reptile</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-warm-400" />
          </CardContent>
        </Card>
      </div>
    )
  }

  if (isError || !reptile || !normalizedReptile) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Edit Reptile</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-warm-600">
              Failed to load reptile. It may have been deleted or you may not have
              access to it.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Edit {reptile.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <ReptileForm
            reptileId={id}
            initialData={normalizedReptile}
            onSuccess={handleSuccess}
            onCancel={handleCancel}
          />
        </CardContent>
      </Card>
    </div>
  )
}
