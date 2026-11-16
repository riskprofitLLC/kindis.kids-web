import type { ReactNode } from 'react'

import { cn } from '@/shared/lib/cn'

interface FormFieldProps {
  name: string
  label: string
  error?: string
  hint?: string
  className?: string
  children: (props: {
    id: string
    'aria-invalid': boolean
    'aria-describedby': string | undefined
  }) => ReactNode
}

// Единообразный вывод полей форм: подпись, подсказка, ошибка с aria-связками
export function FormField({ name, label, error, hint, className, children }: FormFieldProps) {
  const inputId = `field-${name}`
  const describedBy = error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined

  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <label htmlFor={inputId} className="text-sm font-medium text-text">
        {label}
      </label>
      {children({
        id: inputId,
        'aria-invalid': Boolean(error),
        'aria-describedby': describedBy,
      })}
      {hint && !error && (
        <p id={`${inputId}-hint`} className="text-xs text-text-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${inputId}-error`} className="text-xs text-danger">
          {error}
        </p>
      )}
    </div>
  )
}
