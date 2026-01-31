import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { SnakeMascot } from './snake-mascot'

export function HeroSection() {
  return (
    <section className="relative overflow-hidden px-4 py-16 sm:px-6 sm:py-24 lg:py-32">
      {/* Background decorative elements */}
      <div className="absolute inset-0 -z-10">
        {/* Subtle gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />

        {/* Decorative snake silhouette */}
        <svg
          className="absolute -right-20 -top-20 h-96 w-96 text-primary/5 rotate-12"
          viewBox="0 0 200 200"
          aria-hidden="true"
        >
          <path
            d="M20 100 Q60 60 100 100 T180 100"
            fill="none"
            stroke="currentColor"
            strokeWidth="40"
            strokeLinecap="round"
          />
        </svg>
        <svg
          className="absolute -left-20 bottom-0 h-64 w-64 text-primary/5 -rotate-12"
          viewBox="0 0 200 200"
          aria-hidden="true"
        >
          <path
            d="M20 100 Q60 140 100 100 T180 100"
            fill="none"
            stroke="currentColor"
            strokeWidth="30"
            strokeLinecap="round"
          />
        </svg>
      </div>

      <div className="container mx-auto max-w-6xl">
        <div className="flex flex-col items-center text-center">
          {/* Mascot */}
          <div className="mb-8 animate-bounce-slow">
            <SnakeMascot size="lg" />
          </div>

          {/* App name with snake-inspired styling */}
          <h1 className="mb-4 text-5xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
            <span className="bg-gradient-to-r from-primary via-green-500 to-primary bg-clip-text text-transparent">
              Snakey
            </span>
          </h1>

          {/* Tagline */}
          <p className="mb-8 max-w-2xl text-lg text-muted-foreground sm:text-xl">
            The complete care companion for your scaly friends. Track feedings, monitor growth,
            log environment conditions, and never miss a shed cycle again.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col gap-4 sm:flex-row">
            <Button asChild size="lg" className="min-w-[160px]">
              <Link href="/login">Sign In</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="min-w-[160px]">
              <Link href="/register">Get Started</Link>
            </Button>
          </div>

          {/* Trust indicator */}
          <p className="mt-8 text-sm text-muted-foreground">
            Free to use. Works offline. Your data stays yours.
          </p>
        </div>
      </div>
    </section>
  )
}
