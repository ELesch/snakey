import { FeatureCard } from './feature-card'
import {
  FeedingIcon,
  GrowthIcon,
  EnvironmentIcon,
  GalleryIcon,
  VetIcon,
} from './feature-icons'

const features = [
  {
    icon: <FeedingIcon />,
    title: 'Track Feedings',
    description:
      'Log meal schedules, prey types and sizes, feeding responses, and get reminders when your reptile is due for their next meal.',
  },
  {
    icon: <GrowthIcon />,
    title: 'Monitor Growth',
    description:
      'Record weights, lengths, and shed cycles. Visualize growth trends with beautiful charts and spot potential health issues early.',
  },
  {
    icon: <EnvironmentIcon />,
    title: 'Environment Logs',
    description:
      'Track temperature and humidity readings across hot spots, cool zones, and ambient conditions. Set alerts for out-of-range values.',
  },
  {
    icon: <GalleryIcon />,
    title: 'Photo Gallery',
    description:
      'Document your collection with photos. Capture shed progress, growth milestones, and build a visual history of each animal.',
  },
  {
    icon: <VetIcon />,
    title: 'Vet Records',
    description:
      'Maintain complete health histories including vet visits, medications, treatments, and vaccination records all in one place.',
  },
]

export function FeaturesSection() {
  return (
    <section className="relative px-4 py-16 sm:px-6 sm:py-24">
      {/* Background pattern */}
      <div className="absolute inset-0 -z-10">
        <svg className="h-full w-full opacity-[0.02]" aria-hidden="true">
          <defs>
            <pattern
              id="scale-pattern"
              width="40"
              height="40"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M20 0 Q40 20 20 40 Q0 20 20 0"
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#scale-pattern)" />
        </svg>
      </div>

      <div className="container mx-auto max-w-6xl">
        {/* Section header */}
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">
            Everything You Need for Expert Reptile Care
          </h2>
          <p className="mx-auto max-w-2xl text-muted-foreground">
            From ball pythons to bearded dragons, Snakey helps you provide the best care
            for every member of your collection.
          </p>
        </div>

        {/* Feature grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <FeatureCard
              key={feature.title}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
