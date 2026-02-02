'use client'

import { useRouter } from 'next/navigation'
import { ReptileForm } from './reptile-form'
import type { Reptile } from '@/generated/prisma/client'

interface EditReptileFormProps {
  reptileId: string
  reptile: Reptile
}

export function EditReptileForm({ reptileId, reptile }: EditReptileFormProps) {
  const router = useRouter()

  const handleSuccess = (updatedReptile: Reptile) => {
    router.push(`/reptiles/${updatedReptile.id}`)
  }

  const handleCancel = () => {
    router.push(`/reptiles/${reptileId}`)
  }

  return (
    <ReptileForm
      reptileId={reptileId}
      initialData={reptile}
      onSuccess={handleSuccess}
      onCancel={handleCancel}
    />
  )
}
