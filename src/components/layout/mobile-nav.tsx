'use client'

import { useTransition, useMemo, useCallback } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { LogOut } from 'lucide-react'
import { signOut } from '@/lib/supabase/actions'
import { useReptile } from '@/hooks'
import { ReptileContextSection } from './reptile-context-section'
import { NavigationLinks } from './navigation-links'

// Match cuid (25 chars, starts with 'c'), cuid2 (24 chars, no prefix), or UUID formats
// - cuid: c + 24 lowercase alphanumeric = 25 chars total
// - cuid2: 24 lowercase alphanumeric (no guaranteed prefix)
// - UUID: standard 8-4-4-4-12 hex format
const ID_PATTERN = /^([a-z0-9]{24,25}|[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i

interface MobileNavProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function MobileNav({ open, onOpenChange }: MobileNavProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  // Detect if we're on a reptile detail page
  const reptileId = useMemo(() => {
    const match = pathname.match(/^\/reptiles\/([^/]+)/)
    if (match && match[1] && ID_PATTERN.test(match[1])) {
      return match[1]
    }
    return null
  }, [pathname])

  // Fetch reptile data when on detail page
  const { reptile, isPending: reptileLoading } = useReptile(reptileId ?? '', {
    enabled: !!reptileId,
  })

  const currentTab = searchParams.get('tab')

  const handleSignOut = useCallback(() => {
    startTransition(async () => {
      await signOut()
    })
  }, [])

  const handleNavigation = useCallback(() => {
    onOpenChange(false)
  }, [onOpenChange])

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-64 bg-primary-800 p-0 flex flex-col">
        <SheetHeader className="px-4 pt-5 pb-2">
          <SheetTitle className="text-2xl font-bold text-white">
            Snakey
          </SheetTitle>
          <SheetDescription className="sr-only">
            Navigation menu
          </SheetDescription>
        </SheetHeader>

        {/* Reptile Context Section */}
        {reptileId && reptile && !reptileLoading && (
          <ReptileContextSection
            reptile={reptile}
            reptileId={reptileId}
            currentTab={currentTab}
            onNavigate={handleNavigation}
          />
        )}

        <NavigationLinks
          pathname={pathname}
          onNavigate={handleNavigation}
          hasReptileContext={!!reptileId}
        />

        <div className="px-2 pb-4">
          <Button
            variant="ghost"
            onClick={handleSignOut}
            disabled={isPending}
            className="w-full justify-start text-primary-100 hover:bg-primary-700 hover:text-white"
          >
            <LogOut className="mr-3 h-5 w-5 text-primary-300" />
            {isPending ? 'Signing out...' : 'Sign Out'}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
