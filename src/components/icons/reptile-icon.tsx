import { cn } from '@/lib/utils'

export type ReptileIconVariant = 'snake' | 'lizard' | 'turtle'

interface ReptileIconProps {
  variant?: ReptileIconVariant
  className?: string
}

function SnakeIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M4 13c0-3 2-5 5-5h6c3 0 5-2 5-5" />
      <path d="M20 3v2" />
      <path d="M18 3h2" />
      <path d="M4 13c0 3 2 5 5 5h2c3 0 5 2 5 5" />
      <circle cx="4" cy="13" r="1" fill="currentColor" />
    </svg>
  )
}

function LizardIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M4 8c0 0 2-2 4-2s4 2 6 2 4-2 6-2" />
      <path d="M4 8v6c0 2 2 4 4 4h1" />
      <path d="M20 6v8c0 2-2 4-4 4h-1" />
      <path d="M9 18v3" />
      <path d="M15 18v3" />
      <circle cx="7" cy="10" r="1" fill="currentColor" />
      <circle cx="17" cy="8" r="1" fill="currentColor" />
    </svg>
  )
}

function TurtleIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <ellipse cx="12" cy="12" rx="8" ry="5" />
      <path d="M12 7V5" />
      <circle cx="12" cy="4" r="1" fill="currentColor" />
      <path d="M6 14l-2 3" />
      <path d="M18 14l2 3" />
      <path d="M8 10l-3-2" />
      <path d="M16 10l3-2" />
      <path d="M9 12h6" />
    </svg>
  )
}

export function ReptileIcon({ variant = 'snake', className }: ReptileIconProps) {
  const iconClass = cn('h-5 w-5', className)

  switch (variant) {
    case 'lizard':
      return <LizardIcon className={iconClass} />
    case 'turtle':
      return <TurtleIcon className={iconClass} />
    case 'snake':
    default:
      return <SnakeIcon className={iconClass} />
  }
}
