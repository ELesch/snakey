'use client'

import { WifiOff } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function OfflinePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8 text-center">
      <WifiOff className="h-16 w-16 text-warm-400 mb-6" />
      <h1 className="text-2xl font-bold text-warm-900 mb-2">
        You&apos;re Offline
      </h1>
      <p className="text-warm-700 mb-6 max-w-md">
        It looks like you&apos;ve lost your internet connection. Don&apos;t worry -
        your data is saved locally and will sync when you&apos;re back online.
      </p>
      <div className="space-y-4">
        <Button
          onClick={() => window.location.reload()}
          variant="outline"
        >
          Try Again
        </Button>
        <p className="text-sm text-warm-700">
          Some features may be limited while offline.
        </p>
      </div>
    </main>
  )
}
