import { lazy, Suspense } from 'react'

import { Skeleton } from '@/shared/ui/skeleton/skeleton'

// Карта грузится лениво — maplibre не тянется в начальный бандл.
const ProductLocationMap = lazy(() => import('@/features/map/ui/product-location-map'))

interface ProductLocationProps {
  address?: string | null
  latitude?: number | null
  longitude?: number | null
}

// Блок места сделки на карточке товара:адрес текстом и мини-карта с маркером.
export function ProductLocation({ address, latitude, longitude }: ProductLocationProps) {
  const hasPoint = typeof latitude === 'number' && typeof longitude === 'number'
  if (!hasPoint && !address) return null

  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-sm font-semibold text-text">Место сделки</h2>

      {address && (
        <p className="flex items-start gap-2 text-sm text-text">
          <span aria-hidden="true">📍</span>
          <span>{address}</span>
        </p>
      )}

      {hasPoint ? (
        <Suspense fallback={<Skeleton className="h-52 w-full rounded-card" />}>
          <ProductLocationMap latitude={latitude} longitude={longitude} />
        </Suspense>
      ) : (
        <p className="text-xs text-text-muted">Точку на карте продавец не указал.</p>
      )}

      {hasPoint && (
        <a
          className="text-xs text-primary hover:underline"
          href={`https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=17/${latitude}/${longitude}`}
          target="_blank"
          rel="noreferrer"
        >
          Открыть в OpenStreetMap
        </a>
      )}
    </section>
  )
}
