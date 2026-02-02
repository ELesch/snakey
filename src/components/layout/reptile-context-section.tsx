'use client'

import { memo, useCallback, useMemo } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import {
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
import { getSpeciesDisplayName } from '@/lib/species/defaults'
import type { Reptile } from '@/generated/prisma/client'

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

interface ReptileContextSectionProps {
  reptile: Reptile
  reptileId: string
  currentTab: string | null
  onNavigate: () => void
}

export const ReptileContextSection = memo(function ReptileContextSection({
  reptile,
  reptileId,
  currentTab,
  onNavigate,
}: ReptileContextSectionProps) {
  const buildTabUrl = useCallback(
    (tab: string | null) => {
      return tab ? `/reptiles/${reptileId}?tab=${tab}` : `/reptiles/${reptileId}`
    },
    [reptileId]
  )

  const isTabActive = useCallback(
    (tab: string | null) => {
      if (tab === null) return !currentTab || currentTab === 'overview'
      return currentTab === tab
    },
    [currentTab]
  )

  const speciesDisplayName = useMemo(
    () => getSpeciesDisplayName(reptile.species),
    [reptile.species]
  )

  return (
    <div className="px-2 mt-2">
      {/* Reptile Header */}
      <div className="px-3 py-2 bg-primary-900/50 rounded-md">
        <div className="flex items-center gap-2">
          <ReptileIcon className="h-5 w-5 text-accent-400 flex-shrink-0" />
          <div className="min-w-0">
            <p className="font-semibold text-white truncate">{reptile.name}</p>
            <p className="text-xs text-primary-300 truncate">
              {speciesDisplayName}
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
              onClick={onNavigate}
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
          onClick={onNavigate}
          className="group flex items-center rounded-md px-3 py-1.5 text-sm font-medium text-primary-100 hover:bg-primary-700 hover:text-white transition-colors"
        >
          <Pencil className="mr-2 h-4 w-4 flex-shrink-0 text-primary-300" />
          Edit
        </Link>
        <Link
          href={`/reptiles/${reptileId}/delete`}
          onClick={onNavigate}
          className="group flex items-center rounded-md px-3 py-1.5 text-sm font-medium text-red-300 hover:bg-red-900/50 hover:text-red-200 transition-colors"
        >
          <Trash2 className="mr-2 h-4 w-4 flex-shrink-0" />
          Delete
        </Link>
      </div>

      {/* Separator */}
      <div className="my-3 border-t border-primary-600" />
    </div>
  )
})
