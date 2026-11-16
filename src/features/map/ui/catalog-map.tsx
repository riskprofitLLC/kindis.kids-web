import 'maplibre-gl/dist/maplibre-gl.css'

import { Map as MlMap, Marker, Popup } from 'maplibre-gl'
import { useEffect, useMemo, useRef } from 'react'

import { cityCoords } from '@/features/map/lib/city-coords'
import type { ProductCard } from '@/shared/api/catalog-api'
import { formatPrice } from '@/shared/lib/format'

// В dev тайлы идут через прокси vite, в проде — напрямую с OSM.
const TILE_URL = import.meta.env.DEV
  ? '/osm-tiles/{z}/{x}/{y}.png'
  : 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'

interface CatalogMapProps {
  products: ProductCard[]
  className?: string
}

// Карта каталога: растровые тайлы OSM и пины продавцов по городам из выдачи.
// Компонент грузится лениво — maplibre не тянется в начальный бандл.
export default function CatalogMap({ products, className }: CatalogMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  // Группировка по городам: один пин на город, в попапе список поделок.
  const pins = useMemo(() => {
    const grouped = new Map<string, ProductCard[]>()
    for (const product of products) {
      const city = product.childProfile?.city
      if (!city || !cityCoords(city)) continue
      const bucket = grouped.get(city) ?? []
      bucket.push(product)
      grouped.set(city, bucket)
    }
    return [...grouped].map(([city, items]) => ({ city, items }))
  }, [products])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const map = new MlMap({
      container,
      style: {
        version: 8,
        sources: {
          osm: {
            type: 'raster',
            tiles: [TILE_URL],
            tileSize: 256,
            attribution: '© OpenStreetMap contributors',
          },
        },
        layers: [{ id: 'osm', type: 'raster', source: 'osm' }],
      },
      center: [60.0, 55.0],
      zoom: 4,
    })

    const markers = pins.map(({ city, items }) => {
      const coords = cityCoords(city)
      if (!coords) return null

      const popup = new Popup({ offset: 18 }).setHTML(
        `<strong>${city}</strong><br/>Поделок: ${items.length}<br/>` +
          items
            .slice(0, 3)
            .map((item) => `${item.title} — ${formatPrice(item.priceKopecks)}`)
            .join('<br/>'),
      )

      return new Marker({ color: '#e0533a' })
        .setLngLat([coords[1], coords[0]])
        .setPopup(popup)
        .addTo(map)
    })

    if (pins.length > 0) {
      const first = cityCoords(pins[0].city)
      if (first) map.setCenter([first[1], first[0]])
    }

    return () => {
      markers.forEach((marker) => marker?.remove())
      map.remove()
    }
  }, [pins])

  return (
    <div
      ref={containerRef}
      className={className ?? 'h-64 w-full overflow-hidden rounded-card border border-border lg:h-80'}
      aria-label="Карта поделок"
      role="region"
    />
  )
}