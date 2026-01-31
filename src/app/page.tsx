import Link from 'next/link'
import { HeroSection } from '@/components/landing/hero-section'
import { FeaturesSection } from '@/components/landing/features-section'
import { SnakeMascot } from '@/components/landing/snake-mascot'

export default function HomePage() {
  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <HeroSection />

      {/* Features Section */}
      <FeaturesSection />

      {/* Footer CTA Section */}
      <section className="relative overflow-hidden bg-gradient-to-t from-primary/10 to-transparent px-4 py-16 sm:px-6 sm:py-24">
        {/* Decorative snake curves */}
        <svg
          className="absolute left-1/2 top-0 h-24 w-full -translate-x-1/2 text-primary/10"
          viewBox="0 0 1200 100"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path
            d="M0 50 Q300 0 600 50 T1200 50"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
          />
        </svg>

        <div className="container mx-auto max-w-4xl text-center">
          <div className="mb-6 flex justify-center">
            <SnakeMascot size="sm" />
          </div>

          <h2 className="mb-4 text-2xl font-bold tracking-tight sm:text-3xl">
            Ready to Level Up Your Reptile Care?
          </h2>

          <p className="mb-8 text-muted-foreground">
            Join reptile keepers who trust Snakey to help them provide the best care
            for their scaly companions.
          </p>

          <Link
            href="/register"
            className="inline-flex items-center justify-center rounded-lg bg-primary px-8 py-3 text-lg font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            Start Tracking Today
          </Link>

          <p className="mt-4 text-sm text-muted-foreground">
            No credit card required
          </p>
        </div>
      </section>

      {/* Simple footer */}
      <footer className="border-t bg-card px-4 py-8">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2">
              <SnakeMascot size="sm" className="h-8 w-8" />
              <span className="font-semibold text-foreground">Snakey</span>
            </div>

            <nav className="flex gap-6 text-sm text-muted-foreground" aria-label="Footer navigation">
              <Link href="/about" className="hover:text-foreground transition-colors">
                About
              </Link>
              <Link href="/privacy" className="hover:text-foreground transition-colors">
                Privacy
              </Link>
              <Link href="/terms" className="hover:text-foreground transition-colors">
                Terms
              </Link>
            </nav>

            <p className="text-sm text-muted-foreground">
              Made with care for reptile lovers
            </p>
          </div>
        </div>
      </footer>
    </main>
  )
}
