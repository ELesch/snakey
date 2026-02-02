'use client'

import { Button } from '@/components/ui/button'
import { Loader2, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FormButtonsProps {
  /** Whether the form is submitting */
  isSubmitting: boolean
  /** Submit button label */
  submitLabel: string
  /** Optional cancel handler */
  onCancel?: () => void
  /** Compact mode for tracker tab layout (single full-width button) */
  compact?: boolean
  /** Label shown while submitting */
  submittingLabel?: string
  /** Additional class name */
  className?: string
}

export function FormButtons({
  isSubmitting,
  submitLabel,
  onCancel,
  compact = false,
  submittingLabel = 'Saving...',
  className,
}: FormButtonsProps) {
  if (compact) {
    return (
      <Button
        type="submit"
        className={cn('w-full', className)}
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <>
            <Loader2
              className="h-4 w-4 mr-2 animate-spin"
              aria-hidden="true"
            />
            {submittingLabel}
          </>
        ) : (
          <>
            <Check className="h-4 w-4 mr-2" aria-hidden="true" />
            {submitLabel}
          </>
        )}
      </Button>
    )
  }

  return (
    <div className={cn('flex justify-end gap-3 pt-2', className)}>
      {onCancel && (
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
      )}
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting && (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" aria-hidden="true" />
        )}
        {submitLabel}
      </Button>
    </div>
  )
}
