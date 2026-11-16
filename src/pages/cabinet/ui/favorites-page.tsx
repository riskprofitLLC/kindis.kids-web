import { Link } from 'react-router-dom'

import { useFavorites } from '@/features/favorites/model/use-favorites'
import { FavoriteButton } from '@/features/favorites/ui/favorite-button'
import { routes } from '@/shared/config/routes'
import { formatPrice } from '@/shared/lib/format'
import { Alert } from '@/shared/ui/alert/alert'
import { Button } from '@/shared/ui/button/button'
import { EmptyState } from '@/shared/ui/empty-state/empty-state'
import { Skeleton } from '@/shared/ui/skeleton/skeleton'

// Избранное покупателя.
export default function FavoritesPage() {
  const favorites = useFavorites()

  if (favorites.isPending) {
    return (
      <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <li key={`skeleton-${index}`}>
            <Skeleton className="aspect-[3/4] w-full" />
          </li>
        ))}
      </ul>
    )
  }

  if (favorites.isError) {
    return (
      <Alert variant="danger" title="Не удалось загрузить избранное">
        Проверьте соединение и попробуйте снова.
      </Alert>
    )
  }

  const items = favorites.data ?? []

  if (items.length === 0) {
    return (
      <EmptyState
        kind="heart"
        title="В избранном пока пусто"
        description="Нажмите «В избранное» на карточке товара в каталоге."
        action={
          <Button asChild>
            <Link to={routes.catalog}>Открыть каталог</Link>
          </Button>
        }
      />
    )
  }

  return (
    <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3">
      {items.map((product) => (
        <li
          key={product.id}
          className="flex flex-col gap-1 rounded-card border border-border p-3 text-sm"
        >
          <div className="flex items-start justify-between gap-2">
            <Link className="text-text hover:text-primary" to={routes.product(product.id)}>
              {product.title}
            </Link>
            {/* Убрать из избранного — тем же сердечком，что и в каталоге */}
            <FavoriteButton productId={product.id} />
          </div>
          <span className="text-text-muted">{formatPrice(product.priceKopecks)}</span>
        </li>
      ))}
    </ul>
  )
}
