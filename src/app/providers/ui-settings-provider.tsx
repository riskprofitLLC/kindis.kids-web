import { type ReactNode, useEffect } from 'react'

import { useUiSettingsStore } from '@/app/model/ui-settings-store'

// Применяет настройки доступности к <html>: размер текста и контрастность
export function UiSettingsProvider({ children }: { children: ReactNode }) {
  const fontSize = useUiSettingsStore((state) => state.fontSize)
  const highContrast = useUiSettingsStore((state) => state.highContrast)

  useEffect(() => {
    const root = document.documentElement
    root.dataset.fontSize = fontSize
    root.dataset.contrast = highContrast ? 'high' : 'normal'
  }, [fontSize, highContrast])

  return <>{children}</>
}
