import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import type { ButtonHTMLAttributes } from 'react'

import { cn } from '@/shared/lib/cn'

const buttonVariants = cva(
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-control font-medium transition-all duration-200 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:pointer-events-none disabled:opacity-50 active-pressable',
  {
    variants: {
      variant: {
        default:
          'bg-primary text-primary-foreground shadow-lift hover:-translate-y-0.5 hover:bg-primary-hover hover:shadow-float active-pressable',
        outline:
          'border border-border bg-surface text-text shadow-soft hover:-translate-y-0.5 hover:border-border-strong hover:shadow-lift active-pressable',
        ghost: 'text-text hover:bg-surface-muted',
        danger:
          'bg-danger text-danger-foreground shadow-lift hover:-translate-y-0.5 hover:bg-danger/90 hover:shadow-float active-pressable',
      },
      size: {
        default: 'h-11 px-5 text-sm',
        sm: 'h-9 px-3 text-sm',
        icon: 'h-11 w-11',
      },
    },
  },
)

interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

export function Button({ className, variant, size, asChild = false, ...props }: ButtonProps) {
  const Component = asChild ? Slot : 'button'
  return <Component className={cn(buttonVariants({ variant, size }), className)} {...props} />
}

export { buttonVariants }
