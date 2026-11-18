import 'maplibre-gl/dist/maplibre-gl.css'

import { Map as MlMap, Marker } from 'maplibre-gl'
import { useEffect, useRef } from 'react'

interface LocationMapProps {
  latitude?: number | null
  longitude?: number | null
  // Клик по карте отдаёт точку наружу — её подставляет пикер места сделки.
  onPick?: (latitude: number, longitude: number) => void
}

// В dev тайлы идут через прокси vite, в проде — напрямую с OSM.
const TILE_URL = import.meta.env.DEV
  ? '/osm-tiles/{z}/{x}/{y}.png'
  : 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'

const DEFAULT_CENTER: [number, number] = [60.0, 55.0]

// Проверка WebGL до создания карты：без него maplibre бросает исключение.
function webglSupported(): boolean {
  try {
    const canvas = document.createElement('canvas')
    return Boolean(canvas.getContext('webgl') ?? canvas.getContext('experimental-webgl'))
  } catch {
    return false
  }
}

// Интерактивная карта：клик ставит точку，маркер следует за выбранной точкой.
// Без WebGL (старые устройства，тесты) показываем заглушку — форма остаётся рабочей.
export default function LocationMap({ latitude, longitude, onPick }: LocationMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<MlMap | null>(null)
  const markerRef = useRef<Marker | null>(null)
  const pickRef = useRef(onPick)
  const pointRef = useRef({ latitude, longitude })
  // Без WebGL (старые устройства，тесты) карту не строим вовсе.
  const failed = !webglSupported()

  // Синхронизация ref до эффектов：колбэк и стартовая точка без ререндеров карты.
  useEffect(() => {
    pickRef.current = onPick
    pointRef.current = { latitude, longitude }
  })

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const start = pointRef.current
    const hasPoint = typeof start.latitude === 'number' && typeof start.longitude === 'number'

    if (failed) return

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
      center:
        hasPoint && start.longitude !== undefined && start.latitude !== undefined
          ? [start.longitude as number, start.latitude as number]
          : DEFAULT_CENTER,
      zoom: hasPoint ? 15 : 4,
    })
    mapRef.current = map

    map.on('click', (event) => pickRef.current?.(event.lngLat.lat, event.lngLat.lng))

    return () => {
      markerRef.current?.remove()
      markerRef.current = null
      map.remove()
      mapRef.current = null
    }
    // Карта создаётся один раз；точку и клик подхватывают следующие эффекты.
    // failed постоянен на жизнь компонента，поэтому повторного создания не будет.
  }, [failed])

  // Маркер и центрирование следуют за выбранной точкой.
  useEffect(() => {
    const map = mapRef.current
    if (!map || typeof latitude !== 'number' || typeof longitude !== 'number') return

    if (!markerRef.current) {
      markerRef.current = new Marker({ color: '#e0533a' })
    }
    markerRef.current.setLngLat([longitude, latitude]).addTo(map)
    map.easeTo({ center: [longitude, latitude], zoom: Math.max(map.getZoom(), 15) })
  }, [latitude, longitude])

  if (failed) {
    return (
      <p className="flex h-64 w-full items-center justify-center rounded-card border border-border p-4 text-center text-sm text-text-muted">
        Карта недоступна на этом устройстве — укажите адрес текстом ниже.
      </p>
    )
  }

  return (
    <div
      ref={containerRef}
      className="h-64 w-full overflow-hidden rounded-card border border-border"
      role="application"
      aria-label="Карта：кликните，чтобы указать место сделки"
    />
  )
}
