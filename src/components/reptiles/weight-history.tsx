'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useWeights, useDeleteWeight } from '@/hooks/use-weights'
import { WeightForm } from '@/components/forms'
import { WeightCard } from './weight-card'
import { WeightChart } from './weight-chart'
import { Plus, Scale, Loader2, AlertCircle, WifiOff } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import type { Weight } from '@/generated/prisma/client'
import type { OfflineWeight } from '@/lib/offline/db'

interface WeightHistoryProps {
  reptileId: string
}

export function WeightHistory({ reptileId }: WeightHistoryProps) {
  const [showForm, setShowForm] = useState(false)
  const [editingWeight, setEditingWeight] = useState<Weight | OfflineWeight | null>(null)
  const { weights, isPending, isError, error, isOfflineData } = useWeights(reptileId)
  const deleteWeight = useDeleteWeight(reptileId)

  const handleEdit = (weight: Weight | OfflineWeight) => {
    setEditingWeight(weight)
    setShowForm(true)
  }

  const handleDelete = (weightId: string) => {
    if (confirm('Are you sure you want to delete this weight record?')) {
      deleteWeight.mutate(weightId)
    }
  }

  const handleFormClose = () => {
    setShowForm(false)
    setEditingWeight(null)
  }

  const calculateTrend = (index: number): 'up' | 'down' | 'stable' | null => {
    if (index >= weights.length - 1) return null
    const diff = Number(weights[index].weight) - Number(weights[index + 1].weight)
    if (diff > 5) return 'up'
    if (diff < -5) return 'down'
    return 'stable'
  }

  if (isPending) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-warm-400" aria-hidden="true" />
        <span className="sr-only">Loading weight history</span>
      </div>
    )
  }

  if (isError) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-400" aria-hidden="true" />
          <p className="text-warm-600">Failed to load weight history</p>
          <p className="text-sm text-warm-500">{error?.message}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold">Weight History</h3>
          {isOfflineData && (
            <WifiOff className="h-4 w-4 text-warm-400" aria-label="Showing offline data" />
          )}
        </div>
        <Button onClick={() => setShowForm(true)} size="sm">
          <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
          Log Weight
        </Button>
      </div>

      <Dialog open={showForm} onOpenChange={handleFormClose}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingWeight ? 'Edit Weight' : 'Log Weight'}</DialogTitle>
            <DialogDescription>
              {editingWeight ? 'Update the weight record.' : 'Record a new weight measurement.'}
            </DialogDescription>
          </DialogHeader>
          <WeightForm
            reptileId={reptileId}
            weight={editingWeight}
            onSuccess={handleFormClose}
            onCancel={handleFormClose}
          />
        </DialogContent>
      </Dialog>

      {weights.length > 1 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Weight Trend</CardTitle></CardHeader>
          <CardContent><WeightChart weights={weights} /></CardContent>
        </Card>
      )}

      {weights.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Scale className="h-12 w-12 mx-auto mb-4 text-warm-300" aria-hidden="true" />
            <p className="text-warm-600">No weight records yet</p>
            <p className="text-sm text-warm-500">Click &quot;Log Weight&quot; to add one</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {weights.map((weight, index) => (
            <WeightCard
              key={weight.id}
              weight={weight}
              trend={calculateTrend(index)}
              onEdit={() => handleEdit(weight)}
              onDelete={() => handleDelete(weight.id)}
              isDeleting={deleteWeight.isPending}
            />
          ))}
        </div>
      )}
    </div>
  )
}
