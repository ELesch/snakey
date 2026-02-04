'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Download, X } from 'lucide-react'
import { setupInstallPrompt, isAppInstalled } from '@/lib/pwa/register'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function InstallPrompt() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isDismissed, setIsDismissed] = useState(false)
  const [isInstalled, setIsInstalled] = useState(true) // Default true to prevent flash

  useEffect(() => {
    setIsInstalled(isAppInstalled())

    // Check localStorage for dismissed state
    const dismissed = localStorage.getItem('snakey-install-dismissed')
    if (dismissed) {
      setIsDismissed(true)
    }

    setupInstallPrompt((event) => {
      setInstallPrompt(event)
    })
  }, [])

  const handleInstall = async () => {
    if (!installPrompt) return

    await installPrompt.prompt()
    const { outcome } = await installPrompt.userChoice

    if (outcome === 'accepted') {
      setInstallPrompt(null)
    }
  }

  const handleDismiss = () => {
    setIsDismissed(true)
    localStorage.setItem('snakey-install-dismissed', 'true')
  }

  // Don't show if already installed, dismissed, or no prompt available
  if (isInstalled || isDismissed || !installPrompt) {
    return null
  }

  return (
    <Card className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 z-50 shadow-lg">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 p-2 bg-primary-100 rounded-full">
            <Download className="h-5 w-5 text-primary-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-warm-900 dark:text-warm-100">Install Snakey</h3>
            <p className="text-sm text-warm-700 dark:text-warm-300 mt-1">
              Install the app for offline access and a better experience.
            </p>
            <div className="flex gap-2 mt-3">
              <Button size="sm" onClick={handleInstall}>
                Install
              </Button>
              <Button size="sm" variant="ghost" onClick={handleDismiss}>
                Not now
              </Button>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="text-warm-400 hover:text-warm-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </CardContent>
    </Card>
  )
}
