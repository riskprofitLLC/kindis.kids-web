import type { InputHTMLAttributes } from 'react'

import { cn } from '@/shared/lib/cn'

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        'h-11 w-full rounded-control border border-border bg-surface px-3 text-text shadow-soft transition-colors placeholder:text-text-muted hover:border-border-strong focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-50',
        className,
      )}
      {...props}
    />
  )
}
