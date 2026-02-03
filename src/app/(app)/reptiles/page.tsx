import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ReptileGrid } from '@/components/reptiles/reptile-grid'
import { getUserId } from '@/lib/supabase/server'
import { ReptileService } from '@/services/reptile.service'

export default async function ReptilesPage() {
  const userId = await getUserId()
  if (!userId) {
    redirect('/login')
  }

  const reptileService = new ReptileService()
  const { data: reptiles } = await reptileService.list(userId, {})

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-foreground)]">My Reptiles</h1>
          <p className="text-[var(--color-muted-foreground)]">Manage your reptile collection</p>
        </div>
        <Button asChild>
          <Link href="/reptiles/new">Add Reptile</Link>
        </Button>
      </div>

      <ReptileGrid reptiles={reptiles} />
    </div>
  )
}
