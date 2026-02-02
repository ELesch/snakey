'use client'

import { useState, Suspense } from 'react'
import { Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ReptileIcon } from '@/components/icons/reptile-icon'
import { MobileNav } from './mobile-nav'

export function Header() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  return (
    <>
      <header className="sticky top-0 z-40 flex h-14 items-center gap-4 border-b border-[var(--color-border)] bg-[var(--color-card)] px-4 md:px-6">
        <div className="flex items-center gap-2 md:hidden">
          <ReptileIcon variant="snake" className="h-6 w-6 text-primary" />
          <span className="font-semibold text-[var(--color-foreground)]">Snakey</span>
        </div>
        <div className="flex-1" />
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setMobileNavOpen(true)}
          aria-label="Open navigation menu"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </header>

      <Suspense fallback={null}>
        <MobileNav open={mobileNavOpen} onOpenChange={setMobileNavOpen} />
      </Suspense>
    </>
  )
}
