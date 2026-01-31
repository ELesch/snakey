import { Card, CardContent } from '@/components/ui/card'
import { Bug, UtensilsCrossed, Thermometer, Scale } from 'lucide-react'

// TODO: Fetch actual stats from API or offline DB
const stats = [
  { name: 'Total Reptiles', value: '0', icon: Bug, color: 'text-primary-600' },
  { name: 'Feedings Due', value: '0', icon: UtensilsCrossed, color: 'text-amber-600' },
  { name: 'Temp Alerts', value: '0', icon: Thermometer, color: 'text-red-600' },
  { name: 'Recent Weights', value: '0', icon: Scale, color: 'text-blue-600' },
]

export function CollectionStats() {
  return (
    <>
      {stats.map((stat) => (
        <Card key={stat.name}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-warm-600">{stat.name}</p>
                <p className="text-2xl font-bold text-warm-900">{stat.value}</p>
              </div>
              <stat.icon className={`h-8 w-8 ${stat.color}`} />
            </div>
          </CardContent>
        </Card>
      ))}
    </>
  )
}
