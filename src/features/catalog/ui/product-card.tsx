import { Link } from 'react-router-dom'

import { FavoriteButton } from '@/features/favorites/ui/favorite-button'
import { useMediaUrl } from '@/features/media/model/use-media-url'
import type { ProductCard as ProductCardModel } from '@/shared/api/catalog-api'
import { routes } from '@/shared/config/routes'
import { formatPrice, highlightParts } from '@/shared/lib/format'
import { Badge } from '@/shared/ui/badge/badge'
import { Skeleton } from '@/shared/ui/skeleton/skeleton'

function CardPhoto({ mediaId, title }: { mediaId: string | undefined; title: string }) {
  const url = useMediaUrl(mediaId)

  if (!mediaId) {
    return (
      <div className="aspect-square bg-surface-muted" aria-hidden="true">
        <span className="flex h-full items-center justify-center text-xs text-text-muted">
          Фото нет
        </span>
      </div>
    )
  }

  if (!url) return <Skeleton className="aspect-square rounded-none" />

  return (
    <img
      src={url}
      alt={title}
      loading="lazy"
      className="aspect-square w-full object-cover transition-transform duration-300 group-hover:scale-105"
    />
  )
}

interface ProductCardProps {
  product: ProductCardModel
  // Подсветка искомного фрагмента в названии — на странице поиска.
  highlight?: string
}

// Карточка объявления в визуальном языке Avito: квадратное фото, заголовок в две строки,
// крупная цена акцентом и мета-строка «город · бейдж».
export function ProductCard({ product, highlight }: ProductCardProps) {
  const seller = product.childProfile

  return (
    <article className="relative flex h-full flex-col overflow-hidden rounded-card border border-border bg-surface transition-shadow duration-200 hover:shadow-lift focus-within:shadow-lift">
      <Link
        to={routes.product(product.id)}
        className="group relative block overflow-hidden bg-surface-muted"
      >
        <CardPhoto mediaId={product.photoMediaIds[0]} title={product.title} />
      </Link>

      {/* Сердце избранного в углу фото — как в ленте Avito */}
      <FavoriteButton productId={product.id} className="absolute right-2 top-2" />
      <div className="flex flex-1 flex-col gap-1 p-3">
        <h3 className="line-clamp-2 min-h-[2.5rem] text-sm font-medium leading-snug text-text">
          <Link to={routes.product(product.id)} className="block py-[13px] hover:text-primary">
            {highlightParts(product.title, highlight ?? '').map((part, index) =>
              part.match ? (
                <mark key={index} className="bg-primary/20 text-text">
                  {part.text}
                </mark>
              ) : (
                <span key={index}>{part.text}</span>
              ),
            )}
          </Link>
        </h3>
        <p className="text-xl font-extrabold tracking-tight text-primary">
          {formatPrice(product.priceKopecks)}
        </p>

        {/* Мета-строка: город и бейджи через точку — как в ленте Avito */}
        <div className="mt-auto flex flex-wrap items-center gap-x-1.5 gap-y-1 pt-1 text-xs text-text-muted">
          {seller?.city && <span>{seller.city}</span>}
          {seller?.city && (seller.hasDisability || product.stock === 0) && (
            <span aria-hidden="true">·</span>
          )}
          {seller?.hasDisability && <Badge variant="amber">Приоритетный мастер</Badge>}
          {product.stock === 0 && <Badge variant="secondary">Нет в наличии</Badge>}
        </div>
      </div>
    </article>
  )
}
