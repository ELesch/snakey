'use client'

import { Card, CardContent } from '@/components/ui/card'
import { useReportsSummary } from '@/hooks/use-reports'
import { ReptileIcon } from '@/components/icons/reptile-icon'
import { UtensilsCrossed, Sparkles, Heart, Loader2 } from 'lucide-react'

interface StatCardProps {
  name: string
  value: string | number
  icon: React.ElementType
  color: string
  subtitle?: string
  isPending?: boolean
}

function StatCard({ name, value, icon: Icon, color, subtitle, isPending }: StatCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-[var(--color-muted-foreground)]">{name}</p>
            {isPending ? (
              <div className="h-8 w-12 flex items-center">
                <Loader2 className="h-5 w-5 animate-spin text-[var(--color-muted-foreground)]" />
              </div>
            ) : (
              <>
                <p className="text-2xl font-bold text-[var(--color-foreground)]">{value}</p>
                {subtitle && (
                  <p className="text-xs text-[var(--color-muted-foreground)]">{subtitle}</p>
                )}
              </>
            )}
          </div>
          <Icon className={`h-8 w-8 ${color}`} />
        </div>
      </CardContent>
    </Card>
  )
}

function formatRelativeDate(dateString: string | null): string {
  if (!dateString) return 'Never'

  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
  return `${Math.floor(diffDays / 30)} months ago`
}

export function SummaryStats() {
  const { summary, isPending, isError } = useReportsSummary()

  if (isError) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <p className="text-sm text-[var(--color-destructive)]">Failed to load stats</p>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const stats = [
    {
      name: 'Total Reptiles',
      value: summary?.totalReptiles ?? 0,
      icon: ReptileIcon,
      color: 'text-primary-600',
    },
    {
      name: 'Total Feedings',
      value: summary?.totalFeedings ?? 0,
      icon: UtensilsCrossed,
      color: 'text-amber-600',
      subtitle: summary?.lastFeeding ? `Last: ${formatRelativeDate(summary.lastFeeding)}` : undefined,
    },
    {
      name: 'Total Sheds',
      value: summary?.totalSheds ?? 0,
      icon: Sparkles,
      color: 'text-teal-600',
      subtitle: summary?.lastShed ? `Last: ${formatRelativeDate(summary.lastShed)}` : undefined,
    },
    {
      name: 'Health Score',
      value: summary?.healthScore ? `${summary.healthScore}%` : '--',
      icon: Heart,
      color: summary?.healthScore && summary.healthScore >= 80 ? 'text-green-600' : 'text-red-600',
    },
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <StatCard
          key={stat.name}
          name={stat.name}
          value={stat.value}
          icon={stat.icon}
          color={stat.color}
          subtitle={stat.subtitle}
          isPending={isPending}
        />
      ))}
    </div>
  )
}
