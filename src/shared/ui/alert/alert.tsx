import { cva, type VariantProps } from 'class-variance-authority'
import type { HTMLAttributes } from 'react'

import { cn } from '@/shared/lib/cn'

const alertVariants = cva('rounded-md border p-4 text-sm', {
  variants: {
    variant: {
      info: 'border-border bg-surface-muted text-text',
      danger: 'border-danger bg-danger/10 text-danger',
      success: 'border-success bg-success/10 text-success',
    },
  },
  defaultVariants: {
    variant: 'info',
  },
})

interface AlertProps extends HTMLAttributes<HTMLDivElement>, VariantProps<typeof alertVariants> {}

export function Alert({ className, variant, ...props }: AlertProps) {
  return <div role="alert" className={cn(alertVariants({ variant }), className)} {...props} />
}
