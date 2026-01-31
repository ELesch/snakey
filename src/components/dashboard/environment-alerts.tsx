import Link from 'next/link'
import { AlertTriangle, Thermometer, Droplets } from 'lucide-react'
import { cn } from '@/lib/utils'

interface EnvironmentAlert {
  id: string
  reptileId: string
  reptileName: string
  type: 'temperature' | 'humidity'
  severity: 'warning' | 'critical'
  message: string
}

// TODO: Fetch from API or offline DB
const alerts: EnvironmentAlert[] = []

export function EnvironmentAlerts() {
  if (alerts.length === 0) {
    return (
      <div className="text-center py-8 text-warm-500">
        <Thermometer className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p>No environment alerts</p>
        <p className="text-sm">All enclosures within safe ranges</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {alerts.map((alert) => (
        <Link
          key={alert.id}
          href={`/reptiles/${alert.reptileId}`}
          className={cn(
            'flex items-start gap-3 p-3 rounded-lg transition-colors',
            alert.severity === 'critical'
              ? 'bg-red-50 hover:bg-red-100'
              : 'bg-amber-50 hover:bg-amber-100'
          )}
        >
          {alert.type === 'temperature' ? (
            <Thermometer
              className={cn(
                'h-5 w-5 mt-0.5',
                alert.severity === 'critical' ? 'text-red-600' : 'text-amber-600'
              )}
            />
          ) : (
            <Droplets
              className={cn(
                'h-5 w-5 mt-0.5',
                alert.severity === 'critical' ? 'text-red-600' : 'text-amber-600'
              )}
            />
          )}
          <div className="flex-1">
            <p
              className={cn(
                'font-medium',
                alert.severity === 'critical' ? 'text-red-900' : 'text-amber-900'
              )}
            >
              {alert.reptileName}
            </p>
            <p
              className={cn(
                'text-sm',
                alert.severity === 'critical' ? 'text-red-700' : 'text-amber-700'
              )}
            >
              {alert.message}
            </p>
          </div>
          <AlertTriangle
            className={cn(
              'h-4 w-4',
              alert.severity === 'critical' ? 'text-red-600' : 'text-amber-600'
            )}
          />
        </Link>
      ))}
    </div>
  )
}
