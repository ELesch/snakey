'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTransition } from 'react'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Bug,
  Egg,
  LogOut,
} from 'lucide-react'
import { signOut } from '@/lib/supabase/actions'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'My Reptiles', href: '/reptiles', icon: Bug },
  { name: 'Breeding', href: '/breeding', icon: Egg },
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
        <div className="flex flex-1 flex-col overflow-y-auto bg-primary-800 pt-5 pb-4">
          <div className="flex flex-shrink-0 items-center px-4">
            <span className="text-2xl font-bold text-white">Snakey</span>
          </div>
          <nav className="mt-8 flex-1 space-y-1 px-2">
            {navigation.map((item) => {
              const isActive = pathname.startsWith(item.href)
              return (
                <Link
                  key={item.name}
                  href={item.href}
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
          <div className="flex-shrink-0 px-2 pb-4">
            <button
              onClick={handleSignOut}
              disabled={isPending}
              className="group flex w-full items-center rounded-md px-3 py-2 text-sm font-medium text-primary-100 hover:bg-primary-700 hover:text-white disabled:opacity-50"
            >
              <LogOut className="mr-3 h-5 w-5 text-primary-300" />
              {isPending ? 'Signing out...' : 'Sign Out'}
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}
