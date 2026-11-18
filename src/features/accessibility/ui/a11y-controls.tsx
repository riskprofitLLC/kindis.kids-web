import { type FontSize, useUiSettingsStore } from '@/app/model/ui-settings-store'
import { cn } from '@/shared/lib/cn'
import { Button } from '@/shared/ui/button/button'

const FONT_SIZES: Array<{ value: FontSize; label: string; short: string }> = [
  { value: 'normal', label: 'Обычный текст', short: 'А' },
  { value: 'large', label: 'Крупный текст', short: 'А+' },
  { value: 'xlarge', label: 'Очень крупный текст', short: 'А++' },
]

// Переключатели доступности：размер текста и высокая контрастность.
// Состояние живёт в ui-settings-store и применяется к <html> провайдером.
export function AccessibilityControls({ compact = false }: { compact?: boolean }) {
  const fontSize = useUiSettingsStore((state) => state.fontSize)
  const highContrast = useUiSettingsStore((state) => state.highContrast)
  const setFontSize = useUiSettingsStore((state) => state.setFontSize)
  const toggleHighContrast = useUiSettingsStore((state) => state.toggleHighContrast)

  return (
    <div className={cn('flex items-center gap-2', compact ? '' : 'flex-col items-start gap-3')}>
      <div className="flex items-center gap-1" role="group" aria-label="Размер текста">
        {FONT_SIZES.map((size) => (
          <Button
            key={size.value}
            type="button"
            // Тач-таргет не меньше 44x44.
            className="min-h-11 min-w-11 px-2"
            size="sm"
            variant={fontSize === size.value ? 'default' : 'outline'}
            aria-pressed={fontSize === size.value}
            title={size.label}
            onClick={() => setFontSize(size.value)}
          >
            {size.short}
          </Button>
        ))}
      </div>

      <Button
        type="button"
        className="min-h-11"
        size="sm"
        variant={highContrast ? 'default' : 'outline'}
        aria-pressed={highContrast}
        onClick={toggleHighContrast}
      >
        Высокая контрастность
      </Button>
    </div>
  )
}
