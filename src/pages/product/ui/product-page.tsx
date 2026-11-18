import { Link, useParams } from 'react-router-dom'

import { AddToCartButton } from '@/features/cart/ui/add-to-cart-button'
import { ProductCard } from '@/features/catalog/ui/product-card'
import { ContactSellerButton } from '@/features/chat/ui/contact-seller-button'
import { FavoriteButton } from '@/features/favorites/ui/favorite-button'
import { ProductLocation } from '@/features/map/ui/product-location'
import { useProduct, useSimilarProducts } from '@/features/product/model/use-product'
import { ProductGallery } from '@/features/product/ui/product-gallery'
import { ProductReviews } from '@/features/reviews/ui/product-reviews'
import { StarRating } from '@/features/reviews/ui/star-rating'
import { routes } from '@/shared/config/routes'
import { formatDate, formatPrice } from '@/shared/lib/format'
import { Alert } from '@/shared/ui/alert/alert'
import { Badge } from '@/shared/ui/badge/badge'
import { Skeleton } from '@/shared/ui/skeleton/skeleton'

// Карточка товара: галерея до 30 фото, характеристики, автор, цена и остаток.
export default function ProductPage() {
  // В URL товар идентифицируется по id — slug у товаров на бэкенде нет.
  const { slug = '' } = useParams()
  const product = useProduct(slug)
  const similar = useSimilarProducts(slug)

  if (product.isPending) {
    return (
      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-6 lg:grid-cols-2">
        <Skeleton className="aspect-square w-full" />
        <div className="flex flex-col gap-3">
          <Skeleton className="h-6 w-2/3" />
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-11 w-40" />
        </div>
      </div>
    )
  }

  if (product.isError || !product.data) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-6">
        <Alert variant="danger" title="Товар не найден">
          Возможно,его сняли с продажи. Вернитесь в{' '}
          <Link className="text-primary hover:underline" to={routes.catalog}>
            каталог
          </Link>
          .
        </Alert>
      </div>
    )
  }

  const item = product.data
  const seller = item.childProfile

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <nav aria-label="Хлебные крошки" className="mb-4 text-sm text-text-muted">
        <Link className="hover:text-primary" to={routes.catalog}>
          Каталог
        </Link>
        {' / '}
        {item.category && (
          <>
            <span>{item.category.name}</span>
            {' / '}
          </>
        )}
        <span className="text-text">{item.title}</span>
      </nav>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Галерея с сердешком избранного в углу фото */}
        <div className="relative">
          <ProductGallery title={item.title} media={item.media} />
          <FavoriteButton productId={item.id} className="absolute right-3 top-3" />
        </div>

        <div className="flex flex-col gap-4">
          <h1 className="text-xl font-semibold text-text">{item.title}</h1>

          <p className="text-lg font-semibold text-text">{formatPrice(item.priceKopecks)}</p>

          {/* Средний рейтинг товара — как сводка над отзывами */}
          {item.rating !== null && item.reviewsCount > 0 && (
            <StarRating value={item.rating} count={item.reviewsCount} />
          )}

          <p className="text-sm text-text-muted">
            {item.stock > 0 ? `В наличии:${item.stock} шт.` : 'Нет в наличии'}
            {' · размещено '}
            {formatDate(item.createdAt)}
          </p>

          {/* Блок автора со ссылкой на публичную страницу продавца */}
          {seller && (
            <div className="rounded-card border border-border p-3">
              <p className="text-xs text-text-muted">Автор</p>
              <p className="flex flex-wrap items-center gap-2">
                <Link
                  className="font-medium text-text hover:text-primary"
                  to={routes.seller(seller.slug)}
                >
                  {seller.name}
                </Link>
                {seller.hasDisability && <Badge variant="success">Приоритетный мастер</Badge>}
              </p>
              {(seller.city || seller.age) && (
                <p className="text-xs text-text-muted">
                  {[seller.age ? `${seller.age} лет` : '', seller.city ?? '']
                    .filter(Boolean)
                    .join(' · ')}
                </p>
              )}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <AddToCartButton productId={item.id} stock={item.stock} />
            <ContactSellerButton productId={item.id} sellerName={seller?.name} />
          </div>

          {/* Характеристики товара таблицей */}
          {item.specs.length > 0 && (
            <section className="flex flex-col gap-2">
              <h2 className="text-sm font-semibold text-text">Характеристики</h2>
              <table className="w-full text-sm">
                <tbody>
                  {item.specs.map((spec) => (
                    <tr key={spec.name} className="border-b border-border">
                      <th scope="row" className="py-2 pr-4 text-left font-normal text-text-muted">
                        {spec.name}
                      </th>
                      <td className="py-2 text-text">{spec.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          )}

          {item.description && (
            <section className="flex flex-col gap-2">
              <h2 className="text-sm font-semibold text-text">Описание</h2>
              <p className="whitespace-pre-line text-sm text-text">{item.description}</p>
            </section>
          )}
        </div>
      </div>

      {/* Место сделки:адрес и мини-карта с маркером */}
      <div className="mt-10 max-w-2xl">
        <ProductLocation
          address={item.address}
          latitude={item.latitude}
          longitude={item.longitude}
        />
      </div>

      {/* Отзывы и рейтинг */}
      <ProductReviews productId={item.id} />

      {/* Похожие товары из той же категории */}
      {similar.data && similar.data.length > 0 && (
        <section className="mt-10 flex flex-col gap-3">
          <h2 className="text-lg font-semibold text-text">Похожие товары</h2>
          <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
            {similar.data.map((product) => (
              <li key={product.id}>
                <ProductCard product={product} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
