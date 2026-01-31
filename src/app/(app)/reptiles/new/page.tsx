'use client'

import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ReptileForm } from '@/components/reptiles/reptile-form'

export default function NewReptilePage() {
  const router = useRouter()

  const handleSuccess = () => {
    router.push('/reptiles')
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Add New Reptile</CardTitle>
        </CardHeader>
        <CardContent>
          <ReptileForm onSuccess={handleSuccess} />
        </CardContent>
      </Card>
    </div>
  )
}
