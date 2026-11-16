import type { TextareaHTMLAttributes } from 'react'

import { cn } from '@/shared/lib/cn'

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        'min-h-24 w-full rounded-control border border-border bg-surface px-3 py-2 text-text shadow-soft transition-colors placeholder:text-text-muted hover:border-border-strong focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-50',
        className,
      )}
      {...props}
    />
  )
}
