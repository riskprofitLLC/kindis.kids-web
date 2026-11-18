import { useId } from 'react'

import type { CatalogFacets, CategoryNode } from '@/shared/api/catalog-api'
import type { CatalogFilters } from '@/shared/domain/catalog'
import { AGE_BUCKETS } from '@/shared/domain/catalog'
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
  const cityId = useId()

  const flatCategories = categories ? flattenTree(categories) : []
  const categoryCounts = new Map((facets?.categories ?? []).map((f) => [f.slug, f.count]))
  // Название категории для чипса — slug человеку ничего не говорит.
  const activeCategoryName =
    flatCategories.find((category) => category.slug === filters.categorySlug)?.name ??
    filters.categorySlug

  // Активный бакет по границам фильтра — «возрастная группа».
  const activeBucketIndex = AGE_BUCKETS.findIndex(
    (bucket) =>
      bucket.fromAge === (filters.ageFrom ?? null) && bucket.toAge === (filters.ageTo ?? null),
  )

  const chips: Array<{ key: string; label: string; clear: () => void }> = []
  if (filters.categorySlug) {
    chips.push({
      key: 'category',
      label: `Категория: ${activeCategoryName}`,
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
  if (filters.priorityOnly) {
    chips.push({
      key: 'priority',
      label: 'Приоритетный мастер',
      clear: () => onChange({ ...filters, priorityOnly: false }),
    })
  }
  if (activeBucketIndex >= 0) {
    chips.push({
      key: 'age',
      label: AGE_BUCKETS[activeBucketIndex].label,
      clear: () => onChange({ ...filters, ageFrom: null, ageTo: null }),
    })
  }
  if (filters.city) {
    chips.push({
      key: 'city',
      label: `Город: ${filters.city}`,
      clear: () => onChange({ ...filters, city: null }),
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

      {/* Приоритетный мастер */}
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-xs font-semibold uppercase tracking-wide text-text-muted">
          Мастер
        </legend>
        <label className="flex min-h-[44px] items-center gap-2 text-sm text-text">
          <input
            type="checkbox"
            checked={Boolean(filters.priorityOnly)}
            className="h-[18px] w-[18px] shrink-0"
            onChange={(event) => onChange({ ...filters, priorityOnly: event.target.checked })}
          />
          Приоритетные мастера
        </label>
      </fieldset>

      {/* Возрастная группа */}
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-xs font-semibold uppercase tracking-wide text-text-muted">
          Возрастная группа
        </legend>
        {AGE_BUCKETS.map((bucket, index) => (
          <label
            key={bucket.label}
            className="flex min-h-[44px] items-center gap-2 text-sm text-text"
          >
            <input
              type="radio"
              name="age-bucket"
              className="h-[18px] w-[18px] shrink-0"
              checked={activeBucketIndex === index}
              onChange={() => onChange({ ...filters, ageFrom: bucket.fromAge, ageTo: bucket.toAge })}
            />
            {bucket.label}
            {facets?.ageBuckets?.[index] != null && (
              <span className="text-xs text-text-muted">{facets.ageBuckets[index].count}</span>
            )}
          </label>
        ))}
        {activeBucketIndex >= 0 && (
          <button
            type="button"
            className="min-h-11 self-start px-1 text-xs text-primary hover:underline"
            onClick={() => onChange({ ...filters, ageFrom: null, ageTo: null })}
          >
            Любой возраст
          </button>
        )}
      </fieldset>

      {/* Город продавца */}
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-xs font-semibold uppercase tracking-wide text-text-muted">
          Город продавца
        </legend>
        <input
          id={cityId}
          type="search"
          placeholder="Например, Казань"
          aria-label="Город продавца"
          value={filters.city ?? ''}
          onChange={(event) => onChange({ ...filters, city: event.target.value.trim() || null })}
          className="h-11 w-full rounded-control border border-border bg-surface px-3 text-sm text-text"
        />
        {!filters.city && (facets?.cities?.length ?? 0) > 0 && (
          <ul className="mt-1 flex flex-wrap gap-1">
            {(facets?.cities ?? []).slice(0, 8).map((facet) => (
              <li key={facet.city}>
                <button
                  type="button"
                  className="min-h-11 rounded-full border border-border px-3 text-xs text-text-muted hover:bg-surface-muted"
                  onClick={() => onChange({ ...filters, city: facet.city })}
                >
                  {facet.city} · {facet.count}
                </button>
              </li>
            ))}
          </ul>
        )}
      </fieldset>
    </div>
  )
}
