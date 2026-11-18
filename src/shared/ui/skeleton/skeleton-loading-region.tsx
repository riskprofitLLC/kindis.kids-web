import type { ReactNode } from 'react'

interface LoadingRegionProps {
  children: ReactNode
  className?: string
}

// Скелетоны декоративны (aria-hidden)，поэтому контейнер загрузки
// объявляет состояние явно：aria-busy плюс текст для скринридера.
export function LoadingRegion({ children, className }: LoadingRegionProps) {
  return (
    <div aria-busy="true" className={className}>
      <span className="sr-only">Загружаем…</span>
      {children}
    </div>
  )
}