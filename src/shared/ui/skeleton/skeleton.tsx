import type { HTMLAttributes } from 'react'

import { cn } from '@/shared/lib/cn'

// Скелетоны вместо спиннеров при загрузке списков (этап 6)
export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden="true"
      className={cn('animate-pulse rounded-md bg-surface-muted', className)}
      {...props}
    />
  )
}
