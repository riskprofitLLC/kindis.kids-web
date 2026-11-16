import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'

import { useCatalog } from '@/features/catalog/model/use-catalog'
import { ProductCard } from '@/features/catalog/ui/product-card'
import { useSuggestions } from '@/features/search/model/use-suggestions'
import { routes } from '@/shared/config/routes'
import { Alert } from '@/shared/ui/alert/alert'
import { Button } from '@/shared/ui/button/button'
import { Card } from '@/shared/ui/card/card'
import { EmptyState } from '@/shared/ui/empty-state/empty-state'
import { Input } from '@/shared/ui/input/input'
import { Skeleton } from '@/shared/ui/skeleton/skeleton'

// Поиск: крупная строка с живыми подсказками в Card и сетка результатов.
export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const query = searchParams.get('q')?.trim() ?? ''

  const [term, setTerm] = useState(query)
  const [debounced, setDebounced] = useState(query)
  const [open, setOpen] = useState(false)
  const [syncedQuery, setSyncedQuery] = useState(query)

  // Запрос из URL переживает перезагрузку и шаринг ссылки.
  if (query !== syncedQuery) {
    setSyncedQuery(query)
    setTerm(query)
    setDebounced(query)
  }

  // Debounce 300 мс — не дёргаем подсказки на каждую букву.
  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(term), 300)
    return () => window.clearTimeout(timer)
  }, [term])

  const suggestions = useSuggestions(debounced)
  const items = useMemo(
    () => (open && debounced.trim().length >= 2 ? (suggestions.data ?? []) : []),
    [open, debounced, suggestions.data],
  )

  const catalog = useCatalog({ query })
  const results = catalog.data?.pages.flatMap((page) => page.items) ?? []
  const total = catalog.data?.pages[0]?.total ?? 0

  // Подсказки по расширению：убираем последнее слово запроса.
  const broaderTips = useMemo(() => {
    const words = query.split(/\s+/).filter(Boolean)
    return words.length > 1 ? [words.slice(0, -1).join(' ')] : []
  }, [query])

  const submit = (value: string) => {
    const trimmed = value.trim()
    setOpen(false)
    if (!trimmed) return
    setSearchParams(trimmed === query ? {} : { q: trimmed }, { replace: true })
    if (trimmed !== query) void navigate(`${routes.search}?q=${encodeURIComponent(trimmed)}`)
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <h1 className="text-2xl font-bold text-text">Поиск поделок</h1>
      <p className="mt-1 text-sm text-text-muted">
        Найдите подарок по названию, материалу или имени мастера.
      </p>

      {/* Крупная строка поиска с живыми подсказками */}
      <form
        className="relative mt-4 flex flex-col gap-2 sm:flex-row"
        onSubmit={(event) => {
          event.preventDefault()
          submit(term)
        }}
      >
        <Input
          type="search"
          role="combobox"
          aria-expanded={items.length > 0}
          aria-autocomplete="list"
          aria-label="Поиск по каталогу"
          placeholder="бусы из бисера, ёлочная игрушка, вордборд…"
          value={term}
          onChange={(event) => {
            setTerm(event.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => void window.setTimeout(() => setOpen(false), 150)}
          className="h-12 text-base"
        />
        <Button type="submit" className="sm:w-32">
          Найти
        </Button>

        {items.length > 0 && (
          <Card className="absolute left-0 right-0 top-full z-30 mt-1 overflow-hidden p-0 sm:right-36">
            <ul role="listbox" aria-label="Подсказки поиска">
              {items.map((product) => (
                <li key={product.id} role="option" aria-selected={false}>
                  <Link
                    to={routes.product(product.id)}
                    onClick={() => setOpen(false)}
                    className="block px-4 py-2 text-sm text-text hover:bg-surface-muted"
                  >
                    {product.title}
                    <span className="ml-2 text-xs text-text-muted">{product.sellerName}</span>
                  </Link>
                </li>
              ))}
              <li>
                <button
                  type="button"
                  className="block w-full px-4 py-2 text-left text-sm text-primary hover:bg-surface-muted"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => submit(debounced)}
                >
                  Все результаты по «{debounced}»
                </button>
              </li>
            </ul>
          </Card>
        )}
      </form>

      <p className="mt-4 text-sm text-text-muted">
        {query ? `Результаты по запросу «${query}» — ${total}` : 'Начните вводить запрос выше'}
      </p>

      {catalog.isError && (
        <Alert variant="danger" title="Не удалось выполнить поиск">
          Проверьте соединение и попробуйте снова.
        </Alert>
      )}

      {/* Пустое состояние */}
      {query && !catalog.isPending && results.length === 0 && !catalog.isError && (
        <EmptyState
          kind="search"
          title="Ничего не найдено"
          description={
            broaderTips[0]
              ? `Попробуйте короче — например, «${broaderTips[0]}», или загляните в каталог.`
              : 'Проверьте орфографию или загляните в каталог — там удобно фильтровать по категории.'
          }
          action={
            broaderTips[0] ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => setSearchParams({ q: broaderTips[0] }, { replace: true })}
              >
                Искать «{broaderTips[0]}»
              </Button>
            ) : undefined
          }
        />
      )}

      {(results.length > 0 || catalog.isPending) && (
        <ul className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((product) => (
            <li key={product.id}>
              <ProductCard product={product} highlight={query} />
            </li>
          ))}
          {catalog.isPending &&
            Array.from({ length: 6 }).map((_, index) => (
              <li key={`skeleton-${index}`}>
                {/* Скелетон карточки на время загрузки */}
                <Skeleton className="aspect-[3/4] w-full" />
              </li>
            ))}
        </ul>
      )}
    </div>
  )
}