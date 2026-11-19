import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import { useCatalog } from '@/features/catalog/model/use-catalog'
import { ProductCard } from '@/features/catalog/ui/product-card'
import { SortSelect } from '@/features/catalog/ui/sort-select'
import { renewMediaUrl, useMediaUrl } from '@/features/media/model/use-media-url'
import { SellerReviews } from '@/features/reviews/ui/seller-reviews'
import { useSeller } from '@/features/seller/model/use-seller'
import { SellerMediaGallery } from '@/features/seller/ui/seller-media-gallery'
import type { SortValue } from '@/shared/domain/catalog'
import { usePageMeta } from '@/shared/lib/use-page-meta'
import { Alert } from '@/shared/ui/alert/alert'
import { Badge } from '@/shared/ui/badge/badge'
import { Skeleton } from '@/shared/ui/skeleton/skeleton'
import { LoadingRegion } from '@/shared/ui/skeleton/skeleton-loading-region'

// Публичная страница продавца:шапка,галерея,номенклатура с сортировками.
export default function SellerPage() {
  const { slug = '' } = useParams()
  const seller = useSeller(slug)
  const [sort, setSort] = useState<SortValue>('newest')
  const [inStockOnly, setInStockOnly] = useState(false)

  // Мета витрины: имя мастера и его описание, когда оно заполнено.
  usePageMeta({
    title: seller.data ? seller.data.name + ' — kindis.kids' : undefined,
    description: seller.data?.about || undefined,
  })

  const products = useCatalog({ childSlug: slug, sort, inStockOnly })
  const avatarUrl = useMediaUrl(seller.data?.avatarMediaId)

  if (seller.isPending) {
    return (
      <div aria-busy="true" className="mx-auto max-w-6xl px-4 py-6">
        <span className="sr-only">Загружаем…</span>
        <Skeleton className="h-8 w-48" />
        <Skeleton className="mt-3 h-4 w-64" />
      </div>
    )
  }

  if (seller.isError || !seller.data) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-6">
        <Alert variant="danger" title="Продавец не найден">
          Возможно,витрина снята с публикации. Вернитесь в{' '}
          <Link className="text-primary hover:underline" to="/catalog">
            каталог
          </Link>
          .
        </Alert>
      </div>
    )
  }

  const profile = seller.data
  const items = products.data?.pages.flatMap((page) => page.items) ?? []

  // Спецполя профиля бэкенд публично не отдаёт — бейдж приоритета берём
  // из карточек каталога,где флаг мастера уже есть.
  const isPriority = items.some((product) => product.childProfile?.hasDisability)

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      {/* Шапка витрины: аватар, имя, возраст, город, описание, бейдж приоритета */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={`Портрет:${profile.name}`}
            onError={() => void renewMediaUrl(seller.data?.avatarMediaId)}
            className="h-24 w-24 rounded-full object-cover"
          />
        ) : (
          <div
            aria-hidden="true"
            className="flex h-24 w-24 items-center justify-center rounded-full bg-surface-muted text-xl font-semibold text-text-muted"
          >
            {profile.name.slice(0, 1)}
          </div>
        )}
        <div className="flex flex-col gap-2">
          <h1 className="flex flex-wrap items-center gap-2 text-xl font-semibold text-text">
            {profile.name}
            {isPriority && <Badge variant="success">Приоритетный мастер</Badge>}
          </h1>
          <p className="text-sm text-text-muted">
            {[`${profile.age} лет`, profile.city ?? ''].filter(Boolean).join(' · ')}
          </p>
          {profile.about && (
            <p className="max-w-prose whitespace-pre-line text-sm text-text">{profile.about}</p>
          )}
        </div>
      </header>

      <div className="mt-6">
        <SellerMediaGallery media={profile.media} />
      </div>

      {/* Отзывы витрины */}
      <SellerReviews slug={profile.slug} />

      {/* Номенклатура продавца с сортировкой и фильтром наличия */}
      <section className="mt-10 flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold text-text">Товары продавца</h2>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm text-text">
              <input
                type="checkbox"
                className="h-4 w-4"
                checked={inStockOnly}
                onChange={(event) => setInStockOnly(event.target.checked)}
              />
              В наличии
            </label>
            <SortSelect value={sort} onChange={setSort} />
          </div>
        </div>

        {products.isError && (
          <Alert variant="danger" title="Не удалось загрузить товары продавца">
            Проверьте соединение и попробуйте снова.
          </Alert>
        )}

        {!products.isError && items.length === 0 && !products.isPending && (
          <p className="text-sm text-text-muted">У этого продавца пока нет подходящих товаров.</p>
        )}

        {(items.length > 0 || products.isPending) && (
          <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
            {items.map((product) => (
              <li key={product.id}>
                <ProductCard product={product} />
              </li>
            ))}
            {products.isPending &&
              Array.from({ length: 4 }).map((_, index) => (
                <li key={`skeleton-${index}`}>
                  <LoadingRegion>
                    <Skeleton className="aspect-[3/4] w-full" />
                  </LoadingRegion>
                </li>
              ))}
          </ul>
        )}
      </section>
    </div>
  )
}
