'use client'

import { memo, useCallback } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  ClipboardList,
  BarChart3,
  Info,
} from 'lucide-react'
import { ReptileIcon } from '@/components/icons/reptile-icon'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'My Reptiles', href: '/reptiles', icon: ReptileIcon },
  { name: 'Event Log', href: '/tracker', icon: ClipboardList },
  { name: 'Reports', href: '/reports', icon: BarChart3 },
  { name: 'About', href: '/about', icon: Info },
]

interface NavigationLinksProps {
  pathname: string
  onNavigate: () => void
  hasReptileContext?: boolean
}

export const NavigationLinks = memo(function NavigationLinks({
  pathname,
  onNavigate,
  hasReptileContext = false,
}: NavigationLinksProps) {
  const isActive = useCallback(
    (href: string) => {
      // Special handling for /reptiles to not match /reptiles/[id]
      if (href === '/reptiles') {
        return pathname === '/reptiles'
      }
      return pathname.startsWith(href)
    },
    [pathname]
  )
  return (
    <nav className={cn('flex-1 space-y-1 px-2', !hasReptileContext && 'mt-4')}>
      {navigation.map((item) => {
        const itemIsActive = isActive(item.href)
        return (
          <Link
            key={item.name}
            href={item.href}
            onClick={onNavigate}
            aria-current={itemIsActive ? 'page' : undefined}
            className={cn(
              'group flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors',
              itemIsActive
                ? 'bg-primary-900 text-white'
                : 'text-primary-100 hover:bg-primary-700 hover:text-white'
            )}
          >
            <item.icon
              className={cn(
                'mr-3 h-5 w-5 flex-shrink-0',
                itemIsActive ? 'text-white' : 'text-primary-300'
              )}
            />
            {item.name}
          </Link>
        )
      })}
    </nav>
  )
})
