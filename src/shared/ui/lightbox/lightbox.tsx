import * as DialogPrimitive from '@radix-ui/react-dialog'
import { type ReactNode, useEffect } from 'react'

import { cn } from '@/shared/lib/cn'

interface LightboxProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  onPrev?: () => void
  onNext?: () => void
  children: ReactNode
}

// Просмотр медиа крупно: стрелки клавиатурой, закрытие по Esc (Radix)
export function Lightbox({ open, onOpenChange, title, onPrev, onNext, children }: LightboxProps) {
  useEffect(() => {
    if (!open) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft') onPrev?.()
      if (event.key === 'ArrowRight') onNext?.()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onPrev, onNext])

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-40 bg-black/80" />
        <DialogPrimitive.Content
          className={cn(
            'fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-3xl -translate-x-1/2 -translate-y-1/2',
            'rounded-card border border-border bg-surface p-4',
          )}
        >
          <div className="mb-3 flex items-center justify-between gap-2">
            <DialogPrimitive.Title className="text-sm font-medium text-text">
              {title}
            </DialogPrimitive.Title>
            <div className="flex gap-2">
              {onPrev && (
                <button
                  type="button"
                  aria-label="Предыдущее"
                  className="min-h-11 rounded-md border border-border px-3 text-sm text-text hover:bg-surface-muted"
                  onClick={onPrev}
                >
                  ←
                </button>
              )}
              {onNext && (
                <button
                  type="button"
                  aria-label="Следующее"
                  className="min-h-11 rounded-md border border-border px-3 text-sm text-text hover:bg-surface-muted"
                  onClick={onNext}
                >
                  →
                </button>
              )}
              <DialogPrimitive.Close
                className="min-h-11 rounded-md border border-border px-3 text-sm text-text hover:bg-surface-muted"
                aria-label="Закрыть"
              >
                ✕
              </DialogPrimitive.Close>
            </div>
          </div>
          {children}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
