'use client'

import { useTransition } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
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
} from 'lucide-react'
import { ReptileIcon } from '@/components/icons/reptile-icon'
import { signOut } from '@/lib/supabase/actions'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'My Reptiles', href: '/reptiles', icon: ReptileIcon },
  { name: 'Event Log', href: '/tracker', icon: ClipboardList },
  { name: 'Reports', href: '/reports', icon: BarChart3 },
  { name: 'Breeding', href: '/breeding', icon: Egg },
]

interface MobileNavProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function MobileNav({ open, onOpenChange }: MobileNavProps) {
  const pathname = usePathname()
  const [isPending, startTransition] = useTransition()

  const handleSignOut = () => {
    startTransition(async () => {
      await signOut()
    })
  }

  const handleNavigation = () => {
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-64 bg-primary-800 p-0">
        <SheetHeader className="px-4 pt-5 pb-2">
          <SheetTitle className="text-2xl font-bold text-white">
            Snakey
          </SheetTitle>
          <SheetDescription className="sr-only">
            Navigation menu
          </SheetDescription>
        </SheetHeader>

        <nav className="mt-4 flex-1 space-y-1 px-2">
          {navigation.map((item) => {
            const isActive = pathname.startsWith(item.href)
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

        <div className="absolute bottom-0 left-0 right-0 px-2 pb-4">
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
