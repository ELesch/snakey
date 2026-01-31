interface SnakeMascotProps {
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

const sizeMap = {
  sm: 'w-24 h-24',
  md: 'w-40 h-40',
  lg: 'w-64 h-64',
}

export function SnakeMascot({ className = '', size = 'lg' }: SnakeMascotProps) {
  return (
    <svg
      viewBox="0 0 200 200"
      className={`${sizeMap[size]} ${className}`}
      aria-label="Snakey mascot - a friendly green snake"
      role="img"
    >
      {/* Background circle with subtle scale pattern */}
      <defs>
        <pattern id="scales" width="10" height="10" patternUnits="userSpaceOnUse">
          <path
            d="M5 0 Q10 5 5 10 Q0 5 5 0"
            fill="none"
            stroke="currentColor"
            strokeWidth="0.5"
            opacity="0.15"
          />
        </pattern>
        <linearGradient id="snakeBody" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#4ade80" />
          <stop offset="50%" stopColor="#22c55e" />
          <stop offset="100%" stopColor="#16a34a" />
        </linearGradient>
        <linearGradient id="snakeBelly" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#86efac" />
          <stop offset="100%" stopColor="#4ade80" />
        </linearGradient>
        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="2" dy="4" stdDeviation="4" floodOpacity="0.15" />
        </filter>
      </defs>

      {/* Main coiled body */}
      <g filter="url(#shadow)">
        {/* Tail coil (bottom) */}
        <path
          d="M140 160 Q180 160 170 130 Q160 100 130 110 Q100 120 110 150 Q115 165 135 165"
          fill="url(#snakeBody)"
          stroke="#15803d"
          strokeWidth="2"
        />

        {/* Middle coil */}
        <path
          d="M70 140 Q30 140 40 100 Q50 60 90 70 Q130 80 120 120 Q115 145 90 145"
          fill="url(#snakeBody)"
          stroke="#15803d"
          strokeWidth="2"
        />

        {/* Top coil with neck */}
        <path
          d="M100 100 Q60 100 70 60 Q80 30 110 40 Q140 50 130 80 Q125 95 105 95"
          fill="url(#snakeBody)"
          stroke="#15803d"
          strokeWidth="2"
        />

        {/* Neck and head base */}
        <ellipse
          cx="120"
          cy="55"
          rx="28"
          ry="22"
          fill="url(#snakeBody)"
          stroke="#15803d"
          strokeWidth="2"
        />

        {/* Head */}
        <ellipse
          cx="145"
          cy="48"
          rx="22"
          ry="18"
          fill="url(#snakeBody)"
          stroke="#15803d"
          strokeWidth="2"
        />

        {/* Belly stripe on coils */}
        <path
          d="M142 158 Q175 158 168 132 Q162 110 138 118"
          fill="none"
          stroke="url(#snakeBelly)"
          strokeWidth="8"
          strokeLinecap="round"
          opacity="0.6"
        />
        <path
          d="M72 138 Q40 138 48 102 Q55 70 88 78"
          fill="none"
          stroke="url(#snakeBelly)"
          strokeWidth="8"
          strokeLinecap="round"
          opacity="0.6"
        />
      </g>

      {/* Eyes */}
      <g>
        {/* Left eye white */}
        <ellipse cx="138" cy="44" rx="8" ry="9" fill="white" />
        {/* Right eye white */}
        <ellipse cx="155" cy="44" rx="8" ry="9" fill="white" />
        {/* Left pupil */}
        <ellipse cx="140" cy="45" rx="4" ry="5" fill="#1e293b" />
        {/* Right pupil */}
        <ellipse cx="157" cy="45" rx="4" ry="5" fill="#1e293b" />
        {/* Eye sparkles */}
        <circle cx="142" cy="43" r="1.5" fill="white" />
        <circle cx="159" cy="43" r="1.5" fill="white" />
      </g>

      {/* Friendly smile */}
      <path
        d="M140 58 Q148 66 158 58"
        fill="none"
        stroke="#15803d"
        strokeWidth="2.5"
        strokeLinecap="round"
      />

      {/* Tongue (forked) */}
      <g>
        <path
          d="M165 56 Q175 56 180 52"
          fill="none"
          stroke="#ef4444"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M165 56 Q175 58 180 62"
          fill="none"
          stroke="#ef4444"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </g>

      {/* Small decorative scales on head */}
      <g opacity="0.3">
        <circle cx="130" cy="38" r="2" fill="#15803d" />
        <circle cx="125" cy="45" r="1.5" fill="#15803d" />
        <circle cx="132" cy="52" r="1.5" fill="#15803d" />
      </g>

      {/* Tail tip */}
      <path
        d="M135 165 Q145 175 140 185"
        fill="none"
        stroke="url(#snakeBody)"
        strokeWidth="6"
        strokeLinecap="round"
      />
    </svg>
  )
}
