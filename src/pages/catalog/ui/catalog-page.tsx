import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

import { useCatalog } from '@/features/catalog/model/use-catalog'
import { useCategories } from '@/features/catalog/model/use-categories'
import { CatalogFiltersPanel } from '@/features/catalog/ui/catalog-filters-panel'
import { ProductCard } from '@/features/catalog/ui/product-card'
import { SortSelect } from '@/features/catalog/ui/sort-select'
import { RegionSelect } from '@/features/map/ui/region-select'
import type { CatalogSearchParams } from '@/shared/api/catalog-api'
import type { CatalogFilters as Filters } from '@/shared/domain/catalog'
import { parseCatalogState, serializeCatalogState } from '@/shared/domain/catalog'
import { Alert } from '@/shared/ui/alert/alert'
import { Button } from '@/shared/ui/button/button'
import { Card } from '@/shared/ui/card/card'
import { EmptyState } from '@/shared/ui/empty-state/empty-state'
import { Skeleton } from '@/shared/ui/skeleton/skeleton'
import { LoadingRegion } from '@/shared/ui/skeleton/skeleton-loading-region'

// Карта грузится отдельным чанком — начальная загрузка каталога остаётся лёгкой.
const CatalogMap = lazy(() => import('@/features/map/ui/catalog-map'))

// Каталог: фильтры в сайдбаре, сетка карточек и шторка фильтров на мобильном.
export default function CatalogPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)

  const state = useMemo(() => parseCatalogState(Object.fromEntries(searchParams)), [searchParams])
  const filters = state.filters

  const search = useMemo<Omit<CatalogSearchParams, 'cursor'>>(
    () => ({
      query: filters.query,
      categorySlug: filters.categorySlug,
      priceFromKopecks: filters.priceFromKopecks,
      priceToKopecks: filters.priceToKopecks,
      inStockOnly: filters.inStockOnly,
      priorityOnly: filters.priorityOnly,
      ageFrom: filters.ageFrom,
      ageTo: filters.ageTo,
      city: filters.city,
      sort: state.sort,
    }),
    [filters, state.sort],
  )

  const catalog = useCatalog(search)
  const categories = useCategories()
  const { hasNextPage, isFetchingNextPage, fetchNextPage } = catalog

  // Состояние фильтров и сортировки живёт в URL — ссылки shareable.
  const applyState = (next: Filters, sort = state.sort) => {
    setSearchParams(serializeCatalogState({ filters: next, sort }), { replace: true })
  }

  const items = catalog.data?.pages.flatMap((page) => page.items) ?? []
  const facets = catalog.data?.pages[0]?.facets
  const total = catalog.data?.pages[0]?.total ?? 0

  // Бесконечная прокрутка: подгружаем следующую страницу у нижней границы.
  const sentinelRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const node = sentinelRef.current
    if (!node || !hasNextPage || isFetchingNextPage) return

    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) void fetchNextPage()
    })
    observer.observe(node)
    return () => observer.disconnect()
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  // Шторка фильтров на мобильном: закрытие по Escape и блокировка скролла под ней.
  useEffect(() => {
    if (!mobileFiltersOpen) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMobileFiltersOpen(false)
    }
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [mobileFiltersOpen])

  // Панель фильтров переиспользуется в сайдбаре и в шторке.
  const filtersPanel = (
    <CatalogFiltersPanel
      filters={filters}
      facets={facets}
      categories={categories.data}
      onChange={(next) => applyState(next)}
      onReset={() => applyState({})}
    />
  )

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-text sm:text-2xl">Каталог поделок</h1>
          <p className="mt-1 text-sm text-text-muted">
            Ручные работы для детей — выбирайте по категории, цене и наличию.
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-4">
          <SortSelect value={state.sort} onChange={(sort) => applyState(filters, sort)} />
          <RegionSelect
            value={filters.city ?? ''}
            onChange={(city) => applyState({ ...filters, city })}
          />
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[16rem_1fr]">
        {/* Сайдбар фильтров на десктопе */}
        <div className="hidden lg:block">
          <Card className="p-4">{filtersPanel}</Card>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-text-muted">
              {catalog.isPending ? 'Загрузка…' : `Найдено поделок — ${total}`}
            </p>
            {/* Кнопка «Фильтры» открывает шторку только на мобильном */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="lg:hidden"
              onClick={() => setMobileFiltersOpen(true)}
              aria-expanded={mobileFiltersOpen}
            >
              Фильтры
            </Button>
          </div>

          {catalog.isError && (
            <Alert variant="danger" title="Не удалось загрузить каталог">
              Проверьте соединение и попробуйте снова.
            </Alert>
          )}

          {/* Пустое состояние */}
          {!catalog.isError && items.length === 0 && !catalog.isPending && (
            <EmptyState
              kind="basket"
              title="Ничего не найдено"
              description="Попробуйте убрать часть фильтров или изменить запрос — например, выберите категорию покрупнее или снимите ограничение по цене."
              action={
                <Button type="button" variant="outline" onClick={() => applyState({})}>
                  Сбросить фильтры
                </Button>
              }
            />
          )}

          {(items.length > 0 || catalog.isPending) && (
            <>
              {/* Карта с пинами городов выдачи — ленивый чанк */}
              <Suspense
                fallback={
                  <LoadingRegion>
                    <Skeleton className="h-64 w-full rounded-card lg:h-80" />
                  </LoadingRegion>
                }
              >
                <CatalogMap products={items} />
              </Suspense>
              <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4">
                {items.map((product) => (
                  <li key={product.id}>
                    <ProductCard product={product} />
                  </li>
                ))}
                {(catalog.isPending || isFetchingNextPage) &&
                  Array.from({ length: 4 }).map((_, index) => (
                    <li key={`skeleton-${index}`}>
                      {/* Скелетон карточки на время загрузки */}
                      <LoadingRegion>
                        <Skeleton className="aspect-square w-full rounded-card" />
                      </LoadingRegion>
                    </li>
                  ))}
              </ul>

              {/* Страницы догружаются по мере прокрутки */}
              <div ref={sentinelRef} aria-hidden="true" className="mt-4 h-10" />

              {hasNextPage && !isFetchingNextPage && (
                <Button type="button" variant="outline" onClick={() => void fetchNextPage()}>
                  Показать ещё
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Шторка фильтров на мобильном */}
      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <button
            type="button"
            aria-label="Закрыть фильтры"
            className="absolute inset-0 bg-black/40"
            onClick={() => setMobileFiltersOpen(false)}
          />
          <Card className="relative ml-auto flex h-full w-[min(20rem,85vw)] flex-col gap-4 overflow-y-auto p-4">
            {filtersPanel}
            <Button type="button" onClick={() => setMobileFiltersOpen(false)}>
              Показать результаты
            </Button>
          </Card>
        </div>
      )}
    </div>
  )
}
