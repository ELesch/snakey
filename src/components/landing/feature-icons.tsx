interface IconProps {
  className?: string
}

export function FeedingIcon({ className = 'w-6 h-6' }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {/* Snake head eating */}
      <path d="M12 6C8 6 5 9 5 12s3 6 7 6" />
      <circle cx="8" cy="11" r="1" fill="currentColor" />
      <path d="M12 18c2 0 4-1 5-3" />
      {/* Prey silhouette */}
      <ellipse cx="18" cy="12" rx="3" ry="2" />
      <circle cx="19" cy="11" r="0.5" fill="currentColor" />
    </svg>
  )
}

export function GrowthIcon({ className = 'w-6 h-6' }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {/* Chart bars */}
      <path d="M3 20h18" />
      <path d="M6 20V14" />
      <path d="M10 20V10" />
      <path d="M14 20V6" />
      <path d="M18 20V4" />
      {/* Snake silhouette on trend */}
      <path d="M3 14Q6 12 9 10T15 6T21 4" strokeDasharray="2 2" />
    </svg>
  )
}

export function EnvironmentIcon({ className = 'w-6 h-6' }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {/* Thermometer */}
      <path d="M8 14a4 4 0 1 0 4 0V4a2 2 0 0 0-4 0v10z" />
      <circle cx="8" cy="16" r="1" fill="currentColor" />
      <path d="M8 10V6" />
      {/* Humidity drop */}
      <path d="M18 12c0 2.5-2 4.5-3 6 0 0 0-3.5 3-6z" />
      <path d="M18 6c0 1.5-1 2.5-1.5 3.5 0 0 0-2 1.5-3.5z" />
    </svg>
  )
}

export function GalleryIcon({ className = 'w-6 h-6' }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {/* Photo frame */}
      <rect x="3" y="3" width="18" height="18" rx="2" />
      {/* Mountains/landscape */}
      <path d="M3 16l5-5 4 4 5-6 4 5" />
      {/* Sun */}
      <circle cx="16" cy="8" r="2" />
    </svg>
  )
}

export function VetIcon({ className = 'w-6 h-6' }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {/* Medical cross */}
      <path d="M9 4h6v6h5v4h-5v6H9v-6H4v-4h5V4z" />
    </svg>
  )
}

export function BreedingIcon({ className = 'w-6 h-6' }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {/* Nest */}
      <path d="M4 16c0 3 4 5 8 5s8-2 8-5" />
      <path d="M4 16c0-2 2-3 4-3h8c2 0 4 1 4 3" />
      {/* Eggs */}
      <ellipse cx="9" cy="14" rx="2" ry="2.5" />
      <ellipse cx="15" cy="14" rx="2" ry="2.5" />
      <ellipse cx="12" cy="12" rx="2" ry="2.5" />
    </svg>
  )
}

export function ScalePatternIcon({ className = 'w-6 h-6' }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      aria-hidden="true"
    >
      {/* Scale pattern */}
      <path d="M4 6Q8 4 12 6T20 6" />
      <path d="M4 12Q8 10 12 12T20 12" />
      <path d="M4 18Q8 16 12 18T20 18" />
    </svg>
  )
}
