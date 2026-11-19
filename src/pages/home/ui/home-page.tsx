import { Link } from 'react-router-dom'

import { useCatalog } from '@/features/catalog/model/use-catalog'
import { useCategories } from '@/features/catalog/model/use-categories'
import { ProductCard } from '@/features/catalog/ui/product-card'
import type { CategoryNode, ProductCard as ProductCardModel } from '@/shared/api/catalog-api'
import { routes } from '@/shared/config/routes'
import { Button } from '@/shared/ui/button/button'
import { Skeleton } from '@/shared/ui/skeleton/skeleton'
import { LoadingRegion } from '@/shared/ui/skeleton/skeleton-loading-region'
import { HowItWorks } from '@/widgets/home/ui/how-it-works'
import { TrustBlock } from '@/widgets/home/ui/trust-block'

// Эмодзи направлений каталога — по slug реального дерева, с запасным вариантом.
const CATEGORY_EMOJI: Record<string, string> = {
  art: '🎨',
  'jewelry-accessories': '💎',
  toys: '🧸',
  'clothing-textile': '🧶',
  'home-goods': '🏡',
}

function categoryEmoji(node: CategoryNode): string {
  return CATEGORY_EMOJI[node.slug] ?? '🧩'
}

// Скелетон сетки карточек на время загрузки данных.
function GridSkeleton({ count, className }: { count: number; className: string }) {
  return (
    <ul className={className}>
      {Array.from({ length: count }).map((_, index) => (
        <li key={index}>
          <LoadingRegion>
            <Skeleton className="h-full w-full rounded-card" />
          </LoadingRegion>
        </li>
      ))}
    </ul>
  )
}

interface ProductFeedProps {
  title: string
  hint?: string
  items: ProductCardModel[]
  isLoading: boolean
}

// Лента поделок — сетка карточек витрины.
function ProductFeed({ title, hint, items, isLoading }: ProductFeedProps) {
  return (
    <section className="mt-10 flex flex-col gap-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2 sm:flex-nowrap">
        <h2 className="text-lg font-bold tracking-tight text-text sm:text-xl">{title}</h2>
        {hint && <p className="hidden text-sm text-text-muted sm:block">{hint}</p>}
      </div>

      {isLoading && (
        <GridSkeleton
          count={4}
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 [&>li]:aspect-square"
        />
      )}

      {!isLoading && items.length === 0 && (
        <p className="text-sm text-text-muted">Пока пусто — загляните позже.</p>
      )}

      {items.length > 0 && (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
          {items.map((product) => (
            <li key={product.id}>
              <ProductCard product={product} />
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

// Главная: hero без второго поиска (он только в шапке), категории и ленты объявлений.
export default function HomePage() {
  const categories = useCategories()
  const fresh = useCatalog({ sort: 'newest', limit: 12 })
  const priority = useCatalog({ priorityOnly: true, sort: 'newest', limit: 8 })

  const freshItems = fresh.data?.pages[0]?.items ?? []
  const priorityItems = priority.data?.pages[0]?.items ?? []
  const roots = categories.data ?? []

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      {/* Hero:история проекта без поля поиска - единственный поиск в шапке */}
      <section className="rounded-card border border-border bg-surface-muted px-4 py-8 sm:px-8 sm:py-10">
        <h1 className="text-center text-xl font-extrabold tracking-tight text-text sm:text-left sm:text-3xl">
          Каждая покупка поддерживает молодого мастера
        </h1>
        <p className="mx-auto mt-3 max-w-prose text-center text-sm leading-relaxed text-text-muted sm:mx-0 sm:text-left">
          kindis.kids - место, где родители продают поделки своих детей. Ребенок делает работу руками,
          а семья получает доход и повод гордиться его успехом.
        </p>

        {/* Кнопка в каталог и быстрые ссылки на популярные направления */}
        <div className="mt-5 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-sm font-medium sm:justify-start">
          <Button asChild>
            <Link to={routes.catalog}>Смотреть каталог</Link>
          </Button>

          {roots.slice(0, 3).map((node) => (
            <Link
              key={node.id}
              to={`${routes.catalog}?cat=${node.slug}`}
              className="inline-flex min-h-[44px] items-center rounded-control border border-border bg-surface px-4 text-text transition-colors hover:text-primary focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              {node.name}
            </Link>
          ))}
        </div>
      </section>

      {/* Как это работает и блок доверия - выше лент товаров */}
      <HowItWorks />
      <TrustBlock />

      {/* Категории:скруглённые карточки с эмодзи из реального дерева */}
      <section className="mt-8">
        <h2 className="mb-3 text-lg font-bold tracking-tight text-text">Категории</h2>
        {categories.isPending && (
          <GridSkeleton
            count={5}
            className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 [&>li]:h-[104px]"
          />
        )}
        {roots.length > 0 && (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
            {roots.map((node) => (
              <li key={node.id}>
                <Link
                  to={`${routes.catalog}?cat=${node.slug}`}
                  className="flex h-[104px] flex-col items-center justify-center gap-2 rounded-card border border-border bg-surface p-4 text-center transition-colors hover:text-primary focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-primary"
                >
                  <span aria-hidden="true" className="text-[28px] leading-none">
                    {categoryEmoji(node)}
                  </span>
                  <span className="text-sm font-medium leading-tight text-text">{node.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <ProductFeed
        title="Новинки"
        hint="Свежие поступления каталога."
        items={freshItems}
        isLoading={fresh.isPending}
      />

      <ProductFeed
        title="Приоритетные мастера"
        hint="Товары детей с инвалидностью — их продажи особенно важны."
        items={priorityItems}
        isLoading={priority.isPending}
      />
    </div>
  )
}
