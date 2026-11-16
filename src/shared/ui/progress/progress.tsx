import * as ProgressPrimitive from '@radix-ui/react-progress'

import { cn } from '@/shared/lib/cn'

interface ProgressProps {
  value: number
  label: string
  className?: string
}

// Индикатор прогресса с доступным значением для скринридера
export function Progress({ value, label, className }: ProgressProps) {
  const clamped = Math.min(100, Math.max(0, Math.round(value)))

  return (
    <ProgressPrimitive.Root
      role="progressbar"
      aria-label={label}
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn('h-2 w-full overflow-hidden rounded-full bg-surface-muted', className)}
    >
      <ProgressPrimitive.Indicator
        className="h-full bg-primary transition-[width] duration-200"
        style={{ width: `${clamped}%` }}
      />
    </ProgressPrimitive.Root>
  )
}
