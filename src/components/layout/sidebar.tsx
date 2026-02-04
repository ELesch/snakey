'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTransition } from 'react'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  LogOut,
  ClipboardList,
  BarChart3,
  Info,
} from 'lucide-react'
import { ReptileIcon } from '@/components/icons/reptile-icon'
import { signOut } from '@/lib/supabase/actions'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'My Reptiles', href: '/reptiles', icon: ReptileIcon },
  { name: 'Event Log', href: '/tracker', icon: ClipboardList },
  { name: 'Reports', href: '/reports', icon: BarChart3 },
  { name: 'About', href: '/about', icon: Info },
]

export function Sidebar() {
  const pathname = usePathname()
  const [isPending, startTransition] = useTransition()

  const handleSignOut = () => {
    startTransition(async () => {
      await signOut()
    })
  }

  return (
    <>
      {/* Mobile sidebar toggle would go here */}
      <aside className="hidden md:fixed md:inset-y-0 md:flex md:w-64 md:flex-col">
        <div className="flex flex-1 flex-col overflow-y-auto bg-warm-900 pt-5 pb-4">
          <div className="flex flex-shrink-0 items-center px-4">
            <span className="text-2xl font-bold text-white">Snakey</span>
          </div>
          <nav className="mt-8 flex-1 space-y-1 px-2" aria-label="Main navigation">
            {navigation.map((item) => {
              const isActive = pathname.startsWith(item.href)
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  aria-current={isActive ? 'page' : undefined}
                  className={cn(
                    'group flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-warm-950 text-white'
                      : 'text-warm-300 hover:bg-warm-800 hover:text-white'
                  )}
                >
                  <item.icon
                    className={cn(
                      'mr-3 h-5 w-5 flex-shrink-0',
                      isActive ? 'text-white' : 'text-warm-400'
                    )}
                    aria-hidden="true"
                  />
                  {item.name}
                </Link>
              )
            })}
          </nav>
          <div className="flex-shrink-0 px-2 pb-4">
            <button
              onClick={handleSignOut}
              disabled={isPending}
              className="group flex w-full items-center rounded-md px-3 py-2 text-sm font-medium text-warm-300 hover:bg-warm-800 hover:text-white disabled:opacity-50"
            >
              <LogOut className="mr-3 h-5 w-5 text-warm-400" />
              {isPending ? 'Signing out...' : 'Sign Out'}
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}
