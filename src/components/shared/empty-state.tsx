'use client'

import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface EmptyStateProps {
  /** Optional icon to display above the title */
  icon?: React.ReactNode
  /** Main message to display */
  title: string
  /** Optional secondary description text */
  description?: string
  /** Optional action element (button, link, etc.) */
  action?: React.ReactNode
  /** Optional CSS class for the container */
  className?: string
  /** Whether to wrap in a Card component (default: true) */
  withCard?: boolean
  /** Custom height class (default: 'h-[300px]') */
  height?: string
}

/**
 * A reusable empty state component for displaying when there's no data.
 * Used consistently across the app for empty lists, no results, etc.
 *
 * @example
 * ```tsx
 * <EmptyState
 *   icon={<UtensilsCrossed className="h-12 w-12" />}
 *   title="No feeding records yet"
 *   description="Click 'Log Feeding' to add one"
 *   action={<Button onClick={handleAdd}>Log Feeding</Button>}
 * />
 * ```
 */
export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
  withCard = true,
  height = 'h-[300px]',
}: EmptyStateProps) {
  const content = (
    <div
      className={cn(
        height,
        'flex flex-col items-center justify-center text-center',
        className
      )}
    >
      {icon && (
        <div className="mb-4 text-warm-300 dark:text-warm-600" aria-hidden="true">
          {icon}
        </div>
      )}
      <p className="text-warm-700 dark:text-warm-300 font-medium">{title}</p>
      {description && (
        <p className="text-sm text-warm-700 dark:text-warm-300 mt-1">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )

  if (withCard) {
    return (
      <Card>
        <CardContent className="py-8">{content}</CardContent>
      </Card>
    )
  }

  return content
}
