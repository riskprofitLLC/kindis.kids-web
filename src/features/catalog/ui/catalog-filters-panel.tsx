import { useId } from 'react'

import type { CatalogFacets, CategoryNode } from '@/shared/api/catalog-api'
import type { CatalogFilters } from '@/shared/domain/catalog'
import { Badge } from '@/shared/ui/badge/badge'
import { Button } from '@/shared/ui/button/button'

interface CatalogFiltersPanelProps {
  filters: CatalogFilters
  facets?: CatalogFacets
  categories?: CategoryNode[]
  onChange: (next: CatalogFilters) => void
  onReset: () => void
}

// Дерево категорий в плоский список с уровнем вложенности.
function flattenTree(nodes: CategoryNode[], depth = 0): Array<CategoryNode & { depth: number }> {
  return nodes.flatMap((node) => [{ ...node, depth }, ...flattenTree(node.children, depth + 1)])
}

// Панель фильтров каталога: категории, диапазон цены, наличие и чипсы активных.
export function CatalogFiltersPanel({
  filters,
  facets,
  categories,
  onChange,
  onReset,
}: CatalogFiltersPanelProps) {
  const priceFromId = useId()
  const priceToId = useId()

  const flatCategories = categories ? flattenTree(categories) : []
  const categoryCounts = new Map((facets?.categories ?? []).map((f) => [f.slug, f.count]))

  const chips: Array<{ key: string; label: string; clear: () => void }> = []
  if (filters.categorySlug) {
    chips.push({
      key: 'category',
      label: `Категория: ${filters.categorySlug}`,
      clear: () => onChange({ ...filters, categorySlug: null }),
    })
  }
  if (filters.priceFromKopecks != null || filters.priceToKopecks != null) {
    const from = Math.round((filters.priceFromKopecks ?? 0) / 100)
    const to = filters.priceToKopecks != null ? Math.round(filters.priceToKopecks / 100) : '∞'
    chips.push({
      key: 'price',
      label: `Цена: ${from}–${to} ₽`,
      clear: () => onChange({ ...filters, priceFromKopecks: null, priceToKopecks: null }),
    })
  }
  if (filters.inStockOnly) {
    chips.push({
      key: 'stock',
      label: 'В наличии',
      clear: () => onChange({ ...filters, inStockOnly: false }),
    })
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-text">Фильтры</h2>
        {chips.length > 0 && (
          <Button type="button" variant="ghost" size="sm" onClick={onReset}>
            Сбросить
          </Button>
        )}
      </div>

      {/* Активные фильтры чипсами */}
      {chips.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {chips.map((chip) => (
            <li key={chip.key}>
              <button type="button" onClick={chip.clear}>
                <Badge variant="secondary" className="gap-1">
                  {chip.label}
                  <span aria-hidden="true">×</span>
                </Badge>
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Категории */}
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-xs font-semibold uppercase tracking-wide text-text-muted">
          Категории
        </legend>
        <label className="flex min-h-[44px] items-center gap-2 text-sm text-text">
          <input
            type="radio"
            name="category"
            className="h-[18px] w-[18px] shrink-0"
            checked={!filters.categorySlug}
            onChange={() => onChange({ ...filters, categorySlug: null })}
          />
          Все категории
        </label>
        {flatCategories.map((category) => (
          <label
            key={category.slug}
            className="flex min-h-[44px] items-center gap-2 text-sm text-text"
            style={{ paddingLeft: category.depth * 12 }}
          >
            <input
              type="radio"
              name="category"
              className="h-[18px] w-[18px] shrink-0"
              checked={filters.categorySlug === category.slug}
              onChange={() => onChange({ ...filters, categorySlug: category.slug })}
            />
            {category.name}
            {categoryCounts.get(category.slug) != null && (
              <span className="text-xs text-text-muted">{categoryCounts.get(category.slug)}</span>
            )}
          </label>
        ))}
      </fieldset>

      {/* Цена диапазоном */}
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-xs font-semibold uppercase tracking-wide text-text-muted">
          Цена, ₽
        </legend>
        <div className="flex items-center gap-2">
          <input
            id={priceFromId}
            type="number"
            min={0}
            inputMode="numeric"
            placeholder="от"
            aria-label="Цена от"
            className="h-11 w-full rounded-control border border-border bg-surface px-3 text-sm text-text"
            value={filters.priceFromKopecks != null ? filters.priceFromKopecks / 100 : ''}
            onChange={(event) =>
              onChange({
                ...filters,
                priceFromKopecks:
                  event.target.value === '' ? null : Number(event.target.value) * 100,
              })
            }
          />
          <span className="text-text-muted">—</span>
          <input
            id={priceToId}
            type="number"
            min={0}
            inputMode="numeric"
            placeholder="до"
            aria-label="Цена до"
            className="h-11 w-full rounded-control border border-border bg-surface px-3 text-sm text-text"
            value={filters.priceToKopecks != null ? filters.priceToKopecks / 100 : ''}
            onChange={(event) =>
              onChange({
                ...filters,
                priceToKopecks: event.target.value === '' ? null : Number(event.target.value) * 100,
              })
            }
          />
        </div>
      </fieldset>

      {/* Наличие */}
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-xs font-semibold uppercase tracking-wide text-text-muted">
          Наличие
        </legend>
        <label className="flex min-h-[44px] items-center gap-2 text-sm text-text">
          <input
            type="checkbox"
            checked={Boolean(filters.inStockOnly)}
            className="h-[18px] w-[18px] shrink-0"
            onChange={(event) => onChange({ ...filters, inStockOnly: event.target.checked })}
          />
          Только в наличии
        </label>
      </fieldset>
    </div>
  )
}
