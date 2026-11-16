import { SORT_LABELS, SORT_VALUES, type SortValue } from '@/shared/domain/catalog'

interface SortSelectProps {
  value: SortValue
  onChange: (next: SortValue) => void
}

// Сортировка выдачи: цена ↑↓, новизна, популярность, рейтинг.
export function SortSelect({ value, onChange }: SortSelectProps) {
  return (
    <label className="flex items-center gap-2 text-sm text-text">
      Сортировка:
      <select
        className="min-h-11 rounded-md border border-border bg-surface px-2 py-1 text-sm"
        value={value}
        onChange={(event) => onChange(event.target.value as SortValue)}
      >
        {SORT_VALUES.map((sort) => (
          <option key={sort} value={sort}>
            {SORT_LABELS[sort]}
          </option>
        ))}
      </select>
    </label>
  )
}