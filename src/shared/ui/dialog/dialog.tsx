import * as DialogPrimitive from '@radix-ui/react-dialog'
import type { ReactNode } from 'react'

import { cn } from '@/shared/lib/cn'

interface DialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  children?: ReactNode
}

// Модальный диалог на Radix: закрытие по Esc, ловушка фокуса, aria-роли из коробки
export function Dialog({ open, onOpenChange, title, description, children }: DialogProps) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-40 bg-black/50" />
        <DialogPrimitive.Content
          className={cn(
            'fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2',
            'rounded-card border border-border bg-surface p-4 shadow-lg',
          )}
        >
          <DialogPrimitive.Title className="text-base font-semibold text-text">
            {title}
          </DialogPrimitive.Title>
          {/* Описание обязательно для aria-describedby：без текста — скрытое */}
          <DialogPrimitive.Description
            className={description ? 'mt-2 text-sm text-text-muted' : 'sr-only'}
          >
            {description ?? 'Диалоговое окно'}
          </DialogPrimitive.Description>
          <div className="mt-4 flex flex-col gap-3">{children}</div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
