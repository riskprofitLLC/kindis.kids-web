import type { ReactNode } from 'react'

import { cn } from '@/shared/lib/cn'

// Мини-иллюстрации из простых фигур — тёплая handmade-тематика.
function BasketArt() {
  return (
    <svg viewBox="0 0 120 120" fill="none" aria-hidden="true" className="h-full w-full">
      <ellipse cx="60" cy="106" rx="32" ry="6" fill="var(--color-surface-sunk)" />
      <rect x="30" y="46" width="60" height="46" rx="10" fill="var(--color-chip-coral-bg)" />
      <rect
        x="45"
        y="34"
        width="30"
        height="14"
        rx="7"
        stroke="var(--color-primary)"
        strokeWidth="4"
      />
      <circle cx="52" cy="70" r="5" fill="var(--color-chip-teal-bg)" />
      <circle cx="68" cy="78" r="4" fill="var(--color-chip-amber-bg)" />
    </svg>
  )
}

// Лупа с вопросительным знаком — пустой поиск
function SearchArt() {
  return (
    <svg viewBox="0 0 120 120" fill="none" aria-hidden="true" className="h-full w-full">
      <circle cx="54" cy="54" r="26" fill="var(--color-chip-teal-bg)" />
      <circle cx="54" cy="54" r="26" stroke="var(--color-accent)" strokeWidth="4" />
      <rect
        x="70"
        y="70"
        width="8"
        height="24"
        rx="4"
        transform="rotate(45 74 82)"
        fill="var(--color-accent)"
      />
      <circle cx="48" cy="50" r="3" fill="var(--color-text)" />
      <rect x="44" y="58" width="20" height="4" rx="2" fill="var(--color-text)" opacity="0.5" />
    </svg>
  )
}

// Сердечко для избранного
function HeartArt() {
  return (
    <svg viewBox="0 0 120 120" fill="none" aria-hidden="true" className="h-full w-full">
      <circle cx="60" cy="60" r="34" fill="var(--color-chip-coral-bg)" />
      <path
        d="M60 86 C 40 70 38 57 45 51 C 51 46 57 50 60 56 C 63 50 69 46 75 51 C 82 57 80 70 60 86 Z"
        fill="none"
        stroke="var(--color-primary)"
        strokeWidth="5"
        strokeLinecap="round"
      />
    </svg>
  )
}

// Коробка с подарком — пустой список заказов
function BoxArt() {
  return (
    <svg viewBox="0 0 120 120" fill="none" aria-hidden="true" className="h-full w-full">
      <rect x="26" y="46" width="68" height="50" rx="8" fill="var(--color-chip-amber-bg)" />
      <rect
        x="26"
        y="46"
        width="68"
        height="14"
        rx="7"
        fill="var(--color-chip-amber-text)"
        opacity="0.35"
      />
      <rect x="54" y="46" width="12" height="50" fill="var(--color-primary)" opacity="0.4" />
      <circle cx="60" cy="44" r="6" fill="var(--color-primary)" />
    </svg>
  )
}

const ART = {
  basket: BasketArt,
  search: SearchArt,
  heart: HeartArt,
  box: BoxArt,
}
export type EmptyStateKind = keyof typeof ART

interface EmptyStateProps {
  kind: EmptyStateKind
  title: string
  description?: string
  action?: ReactNode
  className?: string
}

// Дружелюбное пустое состояние:иллюстрация,заголовок,следующий шаг.
export function EmptyState({ kind, title, description, action, className }: EmptyStateProps) {
  const Art = ART[kind]

  return (
    <div
      className={cn(
        'flex flex-col items-center gap-4 rounded-card border border-border bg-surface px-6 py-10 text-center shadow-soft',
        className,
      )}
    >
      <div className="h-28 w-28">
        <Art />
      </div>
      <h2 className="text-lg font-bold text-text">{title}</h2>
      {description && <p className="max-w-sm text-sm text-text-muted">{description}</p>}
      {action}
    </div>
  )
}
