import { useId, useState } from 'react'

import type { CatalogFacets, CategoryNode } from '@/shared/api/catalog-api'
import type { CatalogFilters } from '@/shared/domain/catalog'
import { AGE_BUCKETS } from '@/shared/domain/catalog'
import { Button } from '@/shared/ui/button/button'

interface CatalogFiltersProps {
  filters: CatalogFilters
  facets?: CatalogFacets
  categories?: CategoryNode[]
  onChange: (next: CatalogFilters) => void
  onReset: () => void
}

// Плоский список категорий с уровнями — дерево раскрываем выбранной веткой.
function flattenTree(nodes: CategoryNode[], depth = 0): Array<CategoryNode & { depth: number }> {
  return nodes.flatMap((node) => [{ ...node, depth }, ...flattenTree(node.children, depth + 1)])
}

// Сайдбар фильтров: категории, цена, наличие, возраст, город, приоритетный мастер.
// Фасеты показывают количество по каждому фильтру; активные — чипсами со сбросом.
export function CatalogFilters({
  filters,
  facets,
  categories,
  onChange,
  onReset,
}: CatalogFiltersProps) {
  const priceFromId = useId()
  const priceToId = useId()
  const cityId = useId()

  const [priceFrom, setPriceFrom] = useState(
    filters.priceFromKopecks != null ? String(Math.round(filters.priceFromKopecks / 100)) : '',
  )
  const [priceTo, setPriceTo] = useState(
    filters.priceToKopecks != null ? String(Math.round(filters.priceToKopecks / 100)) : '',
  )
  const [city, setCity] = useState(filters.city ?? '')

  const flatCategories = categories ? flattenTree(categories) : []
  const categoryCounts = new Map((facets?.categories ?? []).map((f) => [f.slug, f.count]))
  const cityFacets = facets?.cities ?? []
  const ageFacets = facets?.ageBuckets ?? []

  // Активный бакет по границам фильтра — чекбокс «возрастная группа».
  const activeBucketIndex = AGE_BUCKETS.findIndex(
    (bucket) =>
      bucket.fromAge === (filters.ageFrom ?? null) && bucket.toAge === (filters.ageTo ?? null),
  )

  const hasActiveFilters =
    Boolean(filters.categorySlug) ||
    filters.priceFromKopecks != null ||
    filters.priceToKopecks != null ||
    Boolean(filters.inStockOnly) ||
    Boolean(filters.priorityOnly) ||
    filters.ageFrom != null ||
    filters.ageTo != null ||
    Boolean(filters.city)

  return (
    <aside aria-label="Фильтры каталога" className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-text">Фильтры</h2>
        {hasActiveFilters && (
          <Button type="button" variant="ghost" size="sm" onClick={onReset}>
            Сбросить всё
          </Button>
        )}
      </div>

      {/* Активные фильтры чипсами */}
      {hasActiveFilters && (
        <ul className="flex flex-wrap gap-2">
          {filters.categorySlug && (
            <li>
              <FilterChip
                label={`Категория: ${filters.categorySlug}`}
                onRemove={() => onChange({ ...filters, categorySlug: null })}
              />
            </li>
          )}
          {(filters.priceFromKopecks != null || filters.priceToKopecks != null) && (
            <li>
              <FilterChip
                label={`Цена: ${priceFrom || '0'}–${priceTo || '∞'} ₽`}
                onRemove={() => {
                  setPriceFrom('')
                  setPriceTo('')
                  onChange({ ...filters, priceFromKopecks: null, priceToKopecks: null })
                }}
              />
            </li>
          )}
          {filters.inStockOnly && (
            <li>
              <FilterChip
                label="В наличии"
                onRemove={() => onChange({ ...filters, inStockOnly: false })}
              />
            </li>
          )}
          {filters.priorityOnly && (
            <li>
              <FilterChip
                label="Приоритетный мастер"
                onRemove={() => onChange({ ...filters, priorityOnly: false })}
              />
            </li>
          )}
          {activeBucketIndex >= 0 && (
            <li>
              <FilterChip
                label={AGE_BUCKETS[activeBucketIndex].label}
                onRemove={() => onChange({ ...filters, ageFrom: null, ageTo: null })}
              />
            </li>
          )}
          {filters.city && (
            <li>
              <FilterChip
                label={`Город: ${filters.city}`}
                onRemove={() => {
                  setCity('')
                  onChange({ ...filters, city: null })
                }}
              />
            </li>
          )}
        </ul>
      )}

      {/* Категории деревом */}
      <fieldset className="flex flex-col gap-2">
        <legend className="text-sm font-medium text-text">Категория</legend>
        {flatCategories.length === 0 && <p className="text-xs text-text-muted">Загрузка…</p>}
        {flatCategories.map((category) => {
          const count = categoryCounts.get(category.slug)
          return (
            <label
              key={category.id}
              className="flex items-center gap-2 text-sm text-text"
              style={{ paddingLeft: `${category.depth * 12}px` }}
            >
              <input
                type="radio"
                name="category"
                className="h-4 w-4"
                checked={filters.categorySlug === category.slug}
                onChange={() => onChange({ ...filters, categorySlug: category.slug })}
              />
              <span className="flex-1">{category.name}</span>
              {count !== undefined && <span className="text-xs text-text-muted">{count}</span>}
            </label>
          )
        })}
        {filters.categorySlug && (
          <button
            type="button"
            className="min-h-11 self-start px-1 text-xs text-primary hover:underline"
            onClick={() => onChange({ ...filters, categorySlug: null })}
          >
            Показать все категории
          </button>
        )}
      </fieldset>

      {/* Цена диапазоном */}
      <fieldset className="flex flex-col gap-2">
        <legend className="text-sm font-medium text-text">Цена, ₽</legend>
        <div className="flex items-center gap-2">
          <input
            id={priceFromId}
            type="number"
            min={0}
            inputMode="numeric"
            placeholder="от"
            aria-label="Цена от"
            value={priceFrom}
            onChange={(event) => setPriceFrom(event.target.value)}
            onBlur={() =>
              onChange({
                ...filters,
                priceFromKopecks:
                  priceFrom && Number(priceFrom) > 0 ? Number(priceFrom) * 100 : null,
              })
            }
            className="w-full rounded-md border border-border px-2 py-1 text-sm"
          />
          <span aria-hidden="true" className="text-text-muted">
            —
          </span>
          <input
            id={priceToId}
            type="number"
            min={0}
            inputMode="numeric"
            placeholder="до"
            aria-label="Цена до"
            value={priceTo}
            onChange={(event) => setPriceTo(event.target.value)}
            onBlur={() =>
              onChange({
                ...filters,
                priceToKopecks: priceTo && Number(priceTo) > 0 ? Number(priceTo) * 100 : null,
              })
            }
            className="w-full rounded-md border border-border px-2 py-1 text-sm"
          />
        </div>
      </fieldset>

      {/* Наличие и приоритетный мастер */}
      <fieldset className="flex flex-col gap-2">
        <legend className="text-sm font-medium text-text">Другое</legend>
        <label className="flex items-center gap-2 text-sm text-text">
          <input
            type="checkbox"
            className="h-4 w-4"
            checked={Boolean(filters.inStockOnly)}
            onChange={(event) => onChange({ ...filters, inStockOnly: event.target.checked })}
          />
          <span>Только в наличии</span>
        </label>
        <label className="flex items-center gap-2 text-sm text-text">
          <input
            type="checkbox"
            className="h-4 w-4"
            checked={Boolean(filters.priorityOnly)}
            onChange={(event) => onChange({ ...filters, priorityOnly: event.target.checked })}
          />
          <span>Приоритетные мастера</span>
        </label>
      </fieldset>

      {/* Возрастная группа */}
      <fieldset className="flex flex-col gap-2">
        <legend className="text-sm font-medium text-text">Возрастная группа</legend>
        {AGE_BUCKETS.map((bucket, index) => {
          const facet = ageFacets[index]
          return (
            <label key={bucket.label} className="flex items-center gap-2 text-sm text-text">
              <input
                type="radio"
                name="age-bucket"
                className="h-4 w-4"
                checked={activeBucketIndex === index}
                onChange={() =>
                  onChange({ ...filters, ageFrom: bucket.fromAge, ageTo: bucket.toAge })
                }
              />
              <span className="flex-1">{bucket.label}</span>
              {facet !== undefined && (
                <span className="text-xs text-text-muted">{facet.count}</span>
              )}
            </label>
          )
        })}
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
        <legend className="text-sm font-medium text-text">Город продавца</legend>
        <input
          id={cityId}
          type="search"
          placeholder="Например, Казань"
          aria-label="Город продавца"
          value={city}
          onChange={(event) => {
            const next = event.target.value
            setCity(next)
            onChange({ ...filters, city: next.trim() || null })
          }}
          className="w-full rounded-md border border-border px-2 py-1 text-sm"
        />
        {!city && cityFacets.length > 0 && (
          <ul className="mt-1 flex flex-wrap gap-1">
            {cityFacets.slice(0, 8).map((facet) => (
              <li key={facet.city}>
                <button
                  type="button"
                  className="min-h-11 rounded-full border border-border px-3 text-xs text-text-muted hover:bg-surface-muted"
                  onClick={() => {
                    setCity(facet.city)
                    onChange({ ...filters, city: facet.city })
                  }}
                >
                  {facet.city} · {facet.count}
                </button>
              </li>
            ))}
          </ul>
        )}
      </fieldset>
    </aside>
  )
}

interface FilterChipProps {
  label: string
  onRemove: () => void
}

// Чипс активного фильтра с быстрым сбросом одного значения.
function FilterChip({ label, onRemove }: FilterChipProps) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-surface-muted pl-2 text-xs text-text">
      {label}
      <button
        type="button"
        aria-label={`Убрать фильтр：${label}`}
        className="min-h-6 min-w-6 rounded-full text-text-muted hover:text-danger"
        onClick={onRemove}
      >
        ✕
      </button>
    </span>
  )
}
