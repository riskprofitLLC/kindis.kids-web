import 'maplibre-gl/dist/maplibre-gl.css'

import { Map as MlMap, Marker } from 'maplibre-gl'
import { useEffect, useRef } from 'react'

interface ProductLocationMapProps {
  latitude: number
  longitude: number
  className?: string
}

// В dev тайлы идут через прокси vite, в проде — напрямую с OSM.
const TILE_URL = import.meta.env.DEV
  ? '/osm-tiles/{z}/{x}/{y}.png'
  : 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'

// Мини-карта точки сделки:растр OSM и один маркер по координатам товара.
export default function ProductLocationMap({
  latitude,
  longitude,
  className,
}: ProductLocationMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)

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
      center: [longitude, latitude],
      zoom: 15,
    })

    const marker = new Marker({ color: '#e0533a' }).setLngLat([longitude, latitude]).addTo(map)

    return () => {
      marker.remove()
      map.remove()
    }
  }, [latitude, longitude])

  return (
    <div
      ref={containerRef}
      className={className ?? 'h-52 w-full overflow-hidden rounded-card border border-border'}
      role="region"
      aria-label="Карта места сделки"
    />
  )
}
