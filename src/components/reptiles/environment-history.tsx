'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useEnvironmentLogs, useDeleteEnvironmentLog } from '@/hooks/use-environment-logs'
import { EnvironmentForm } from '@/components/forms'
import { EnvironmentChart } from './environment-chart'
import { EnvironmentCard } from './environment-card'
import { CurrentConditions } from './current-conditions'
import { Plus, Thermometer, Loader2, AlertCircle, WifiOff } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import type { EnvironmentLog } from '@/generated/prisma/client'
import type { OfflineEnvironmentLog } from '@/lib/offline/db'

interface EnvironmentHistoryProps {
  reptileId: string
  species?: string
}

export function EnvironmentHistory({ reptileId, species = 'ball_python' }: EnvironmentHistoryProps) {
  const [showForm, setShowForm] = useState(false)
  const [editingLog, setEditingLog] = useState<EnvironmentLog | OfflineEnvironmentLog | null>(null)
  const { logs, isPending, isError, error, isOfflineData } = useEnvironmentLogs(reptileId)
  const deleteLog = useDeleteEnvironmentLog(reptileId)

  const handleEdit = (log: EnvironmentLog | OfflineEnvironmentLog) => {
    setEditingLog(log)
    setShowForm(true)
  }

  const handleDelete = (logId: string) => {
    if (confirm('Are you sure you want to delete this environment reading?')) {
      deleteLog.mutate(logId)
    }
  }

  const handleFormClose = () => {
    setShowForm(false)
    setEditingLog(null)
  }

  if (isPending) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-warm-400" aria-hidden="true" />
        <span className="sr-only">Loading environment history</span>
      </div>
    )
  }

  if (isError) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-400" aria-hidden="true" />
          <p className="text-warm-700 dark:text-warm-300">Failed to load environment history</p>
          <p className="text-sm text-warm-700 dark:text-warm-300">{error?.message}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold">Environment History</h3>
          {isOfflineData && (
            <WifiOff className="h-4 w-4 text-warm-400" aria-label="Showing offline data" />
          )}
        </div>
        <Button onClick={() => setShowForm(true)} size="sm">
          <Plus className="h-4 w-4 mr-2" aria-hidden="true" />Log Reading
        </Button>
      </div>

      <Dialog open={showForm} onOpenChange={handleFormClose}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingLog ? 'Edit Reading' : 'Log Reading'}</DialogTitle>
            <DialogDescription>
              {editingLog ? 'Update the environment reading.' : 'Record temperature and humidity.'}
            </DialogDescription>
          </DialogHeader>
          <EnvironmentForm
            reptileId={reptileId}
            log={editingLog}
            onSuccess={handleFormClose}
            onCancel={handleFormClose}
          />
        </DialogContent>
      </Dialog>

      {logs.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Current Conditions</CardTitle></CardHeader>
          <CardContent><CurrentConditions log={logs[0]} species={species} /></CardContent>
        </Card>
      )}

      {logs.length > 1 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Trends</CardTitle></CardHeader>
          <CardContent><EnvironmentChart logs={logs} /></CardContent>
        </Card>
      )}

      {logs.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Thermometer className="h-12 w-12 mx-auto mb-4 text-warm-300 dark:text-warm-600" aria-hidden="true" />
            <p className="text-warm-700 dark:text-warm-300">No environment readings yet</p>
            <p className="text-sm text-warm-700 dark:text-warm-300">Click &quot;Log Reading&quot; to add one</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {logs.map((log) => (
            <EnvironmentCard
              key={log.id}
              log={log}
              species={species}
              onEdit={() => handleEdit(log)}
              onDelete={() => handleDelete(log.id)}
              isDeleting={deleteLog.isPending}
            />
          ))}
        </div>
      )}
    </div>
  )
}
