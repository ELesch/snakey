'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Bug, UtensilsCrossed, Thermometer, Scale, AlertCircle, Loader2 } from 'lucide-react'
import { useDashboardStats } from '@/hooks/use-dashboard'

interface StatCardProps {
  name: string
  value: string | number
  icon: React.ElementType
  color: string
  isPending?: boolean
}

function StatCard({ name, value, icon: Icon, color, isPending }: StatCardProps) {
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
              <p className="text-2xl font-bold text-[var(--color-foreground)]">{value}</p>
            )}
          </div>
          <Icon className={`h-8 w-8 ${color}`} />
        </div>
      </CardContent>
    </Card>
  )
}

export function CollectionStats() {
  const { stats, isPending, isError } = useDashboardStats()

  if (isError) {
    return (
      <>
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-[var(--color-muted-foreground)]">Error</p>
                  <p className="text-sm text-[var(--color-destructive)]">Could not load</p>
                </div>
                <AlertCircle className="h-8 w-8 text-[var(--color-destructive)]" />
              </div>
            </CardContent>
          </Card>
        ))}
      </>
    )
  }

  const statItems = [
    {
      name: 'Total Reptiles',
      value: stats?.totalReptiles ?? 0,
      icon: Bug,
      color: 'text-primary-600',
    },
    {
      name: 'Feedings Due',
      value: stats?.feedingsDue ?? 0,
      icon: UtensilsCrossed,
      color: 'text-amber-600',
    },
    {
      name: 'Temp Alerts',
      value: stats?.environmentAlerts ?? 0,
      icon: Thermometer,
      color: 'text-red-600',
    },
    {
      name: 'Recent Weights',
      value: stats?.recentWeights ?? 0,
      icon: Scale,
      color: 'text-blue-600',
    },
  ]

  return (
    <>
      {statItems.map((stat) => (
        <StatCard
          key={stat.name}
          name={stat.name}
          value={stat.value}
          icon={stat.icon}
          color={stat.color}
          isPending={isPending}
        />
      ))}
    </>
  )
}
