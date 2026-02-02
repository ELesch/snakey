'use client'

import { useTransition, useMemo } from 'react'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Egg,
  LogOut,
  ClipboardList,
  BarChart3,
  Info,
  Home,
  Utensils,
  Sparkles,
  Scale,
  Thermometer,
  Image,
  Stethoscope,
  Pill,
  Pencil,
  Trash2,
} from 'lucide-react'
import { ReptileIcon } from '@/components/icons/reptile-icon'
import { signOut } from '@/lib/supabase/actions'
import { useReptile } from '@/hooks'
import { getSpeciesDisplayName } from '@/lib/species/defaults'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'My Reptiles', href: '/reptiles', icon: ReptileIcon },
  { name: 'Event Log', href: '/tracker', icon: ClipboardList },
  { name: 'Reports', href: '/reports', icon: BarChart3 },
  { name: 'Breeding', href: '/breeding', icon: Egg },
  { name: 'About', href: '/about', icon: Info },
]

const reptileTabs = [
  { name: 'Overview', tab: null, icon: Home },
  { name: 'Feedings', tab: 'feedings', icon: Utensils },
  { name: 'Sheds', tab: 'sheds', icon: Sparkles },
  { name: 'Weights', tab: 'weights', icon: Scale },
  { name: 'Environment', tab: 'environment', icon: Thermometer },
  { name: 'Photos', tab: 'photos', icon: Image },
  { name: 'Vet', tab: 'vet', icon: Stethoscope },
  { name: 'Medications', tab: 'medications', icon: Pill },
]

// Match cuid (25 chars, alphanumeric, starts with 'c') or UUID formats
const ID_PATTERN = /^(c[a-z0-9]{24}|[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i

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

  const handleSignOut = () => {
    startTransition(async () => {
      await signOut()
    })
  }

  const handleNavigation = () => {
    onOpenChange(false)
  }

  const buildTabUrl = (tab: string | null) => {
    if (!reptileId) return '#'
    return tab ? `/reptiles/${reptileId}?tab=${tab}` : `/reptiles/${reptileId}`
  }

  const isTabActive = (tab: string | null) => {
    if (tab === null) return !currentTab || currentTab === 'overview'
    return currentTab === tab
  }

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
          <div className="px-2 mt-2">
            {/* Reptile Header */}
            <div className="px-3 py-2 bg-primary-900/50 rounded-md">
              <div className="flex items-center gap-2">
                <ReptileIcon className="h-5 w-5 text-accent-400 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="font-semibold text-white truncate">{reptile.name}</p>
                  <p className="text-xs text-primary-300 truncate">
                    {getSpeciesDisplayName(reptile.species)}
                  </p>
                </div>
              </div>
            </div>

            {/* Tab Links */}
            <nav className="mt-2 space-y-0.5">
              {reptileTabs.map((item) => {
                const isActive = isTabActive(item.tab)
                return (
                  <Link
                    key={item.name}
                    href={buildTabUrl(item.tab)}
                    onClick={handleNavigation}
                    aria-current={isActive ? 'page' : undefined}
                    className={cn(
                      'group flex items-center rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-accent-600 text-white'
                        : 'text-primary-100 hover:bg-primary-700 hover:text-white'
                    )}
                  >
                    <item.icon
                      className={cn(
                        'mr-2 h-4 w-4 flex-shrink-0',
                        isActive ? 'text-white' : 'text-primary-300'
                      )}
                    />
                    {item.name}
                  </Link>
                )
              })}
            </nav>

            {/* Action Links */}
            <div className="mt-2 pt-2 border-t border-primary-700 space-y-0.5">
              <Link
                href={`/reptiles/${reptileId}/edit`}
                onClick={handleNavigation}
                className="group flex items-center rounded-md px-3 py-1.5 text-sm font-medium text-primary-100 hover:bg-primary-700 hover:text-white transition-colors"
              >
                <Pencil className="mr-2 h-4 w-4 flex-shrink-0 text-primary-300" />
                Edit
              </Link>
              <Link
                href={`/reptiles/${reptileId}/delete`}
                onClick={handleNavigation}
                className="group flex items-center rounded-md px-3 py-1.5 text-sm font-medium text-red-300 hover:bg-red-900/50 hover:text-red-200 transition-colors"
              >
                <Trash2 className="mr-2 h-4 w-4 flex-shrink-0" />
                Delete
              </Link>
            </div>

            {/* Separator */}
            <div className="my-3 border-t border-primary-600" />
          </div>
        )}

        <nav className={cn('flex-1 space-y-1 px-2', !reptileId && 'mt-4')}>
          {navigation.map((item) => {
            // Special handling for /reptiles to not match /reptiles/[id]
            const isActive =
              item.href === '/reptiles'
                ? pathname === '/reptiles'
                : pathname.startsWith(item.href)
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={handleNavigation}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'group flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary-900 text-white'
                    : 'text-primary-100 hover:bg-primary-700 hover:text-white'
                )}
              >
                <item.icon
                  className={cn(
                    'mr-3 h-5 w-5 flex-shrink-0',
                    isActive ? 'text-white' : 'text-primary-300'
                  )}
                />
                {item.name}
              </Link>
            )
          })}
        </nav>

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
