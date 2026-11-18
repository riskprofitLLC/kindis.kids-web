import { Link } from 'react-router-dom'

import { ProductCard } from '@/features/catalog/ui/product-card'
import { useFavorites } from '@/features/favorites/model/use-favorites'
import { routes } from '@/shared/config/routes'
import { Alert } from '@/shared/ui/alert/alert'
import { Button } from '@/shared/ui/button/button'
import { EmptyState } from '@/shared/ui/empty-state/empty-state'
import { Skeleton } from '@/shared/ui/skeleton/skeleton'
import { LoadingRegion } from '@/shared/ui/skeleton/skeleton-loading-region'

// Избранное покупателя.
export default function FavoritesPage() {
  const favorites = useFavorites()

  if (favorites.isPending) {
    return (
      <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <li key={`skeleton-${index}`}>
            <LoadingRegion>
              <Skeleton className="aspect-[3/4] w-full" />
            </LoadingRegion>
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
        // Общая карточка каталога: фото, продавец, бейджи и сердечко внутри.
        <li key={product.id}>
          <ProductCard product={product} />
        </li>
      ))}
    </ul>
  )
}