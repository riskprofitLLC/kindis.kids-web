import { cva, type VariantProps } from 'class-variance-authority'
import type { HTMLAttributes } from 'react'

import { cn } from '@/shared/lib/cn'

const badgeVariants = cva(
  'inline-flex items-center rounded-chip px-2.5 py-0.5 text-xs font-semibold',
  {
    variants: {
      variant: {
        default: 'bg-chip-coral-bg text-chip-coral-text',
        secondary: 'bg-surface-muted text-text-muted',
        danger: 'bg-danger text-danger-foreground',
        success: 'bg-chip-teal-bg text-chip-teal-text',
        amber: 'bg-chip-amber-bg text-chip-amber-text',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

interface BadgeProps extends HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />
}
