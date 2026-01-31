'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDate } from '@/lib/utils'
import { Plus, Scale, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Weight {
  id: string
  date: Date
  weight: number // in grams
  notes?: string
}

interface WeightHistoryProps {
  reptileId: string
}

export function WeightHistory({ reptileId }: WeightHistoryProps) {
  const [showForm, setShowForm] = useState(false)

  // TODO: Fetch from API or offline DB
  const weights: Weight[] = []

  const calculateTrend = (index: number): 'up' | 'down' | 'stable' | null => {
    if (index >= weights.length - 1) return null
    const diff = weights[index].weight - weights[index + 1].weight
    if (diff > 5) return 'up'
    if (diff < -5) return 'down'
    return 'stable'
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Weight History</h3>
        <Button onClick={() => setShowForm(true)} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Log Weight
        </Button>
      </div>

      {/* TODO: Weight chart component */}
      {weights.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Weight Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48 flex items-center justify-center text-warm-400">
              {/* TODO: Recharts line chart */}
              <p>Weight chart will appear here</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* TODO: Weight form modal */}

      {weights.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Scale className="h-12 w-12 mx-auto mb-4 text-warm-300" />
            <p className="text-warm-600">No weight records yet</p>
            <p className="text-sm text-warm-500">Click &quot;Log Weight&quot; to add one</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {weights.map((weight, index) => {
            const trend = calculateTrend(index)
            return (
              <Card key={weight.id}>
                <CardContent className="py-3 px-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1">
                        <span className="text-lg font-semibold">{weight.weight}g</span>
                        {trend === 'up' && (
                          <TrendingUp className="h-4 w-4 text-green-600" />
                        )}
                        {trend === 'down' && (
                          <TrendingDown className="h-4 w-4 text-red-600" />
                        )}
                        {trend === 'stable' && (
                          <Minus className="h-4 w-4 text-warm-400" />
                        )}
                      </div>
                      <p className="text-warm-500">{formatDate(weight.date)}</p>
                    </div>
                    {weight.notes && (
                      <p className="text-sm text-warm-600 max-w-xs truncate">
                        {weight.notes}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
