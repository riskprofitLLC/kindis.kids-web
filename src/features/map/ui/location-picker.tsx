import { lazy, Suspense, useState } from 'react'

import { reverseGeocode } from '@/features/map/lib/reverse-geocode'
import { Button } from '@/shared/ui/button/button'
import { Skeleton } from '@/shared/ui/skeleton/skeleton'

// Карта грузится лениво — maplibre не тянется в начальный бандл.
const LocationMap = lazy(() => import('@/features/map/ui/location-map'))

export interface LocationValue {
  address: string
  latitude: number | null
  longitude: number | null
}

interface LocationPickerProps {
  value: LocationValue
  onChange: (next: LocationValue) => void
}

// Пикер места сделки：клик по карте ставит точку，адрес подтягивается обратным
// геокодированием，при отказе или ошибке продавец вводит его вручную.
export function LocationPicker({ value, onChange }: LocationPickerProps) {
  const [geocoding, setGeocoding] = useState(false)
  const [geocodeError, setGeocodeError] = useState<string | null>(null)
  // Адрес，введённый продавцом вручную，автоподстановка не перезаписывает.
  const [addressTouched, setAddressTouched] = useState(false)

  const pick = async (latitude: number, longitude: number) => {
    setGeocodeError(null)
    onChange({ ...value, latitude, longitude })

    if (addressTouched) return

    setGeocoding(true)
    const address = await reverseGeocode(latitude, longitude)
    setGeocoding(false)

    if (address) {
      onChange({ ...value, latitude, longitude, address })
      return
    }
    setGeocodeError('Адрес не определился автоматически — введите его вручную.')
  }

  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="text-sm font-medium text-text">Место сделки</legend>

      <Suspense fallback={<Skeleton className="h-64 w-full rounded-card" />}>
        <LocationMap
          latitude={value.latitude}
          longitude={value.longitude}
          onPick={(latitude, longitude) => void pick(latitude, longitude)}
        />
      </Suspense>

      <label className="flex flex-col gap-1 text-sm">
        Адрес
        <input
          className="min-h-11 rounded-md border border-border px-3 text-sm"
          value={value.address}
          placeholder="Например：Сочи，ул. Ленина，10"
          onChange={(event) => {
            setAddressTouched(true)
            onChange({ ...value, address: event.target.value })
          }}
        />
      </label>

      <div className="flex flex-wrap items-center gap-3">
        <span className="text-xs text-text-muted">
          {value.latitude !== null && value.longitude !== null
            ? `Точка：${value.latitude.toFixed(5)}, ${value.longitude.toFixed(5)}`
            : 'Точка не выбрана — кликните по карте'}
        </span>
        {(value.latitude !== null || value.address) && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setAddressTouched(false)
              onChange({ address: '', latitude: null, longitude: null })
            }}
          >
            Сбросить место
          </Button>
        )}
      </div>

      {geocoding && <p className="text-xs text-text-muted">Определяем адрес…</p>}
      {geocodeError && (
        <p role="alert" className="text-xs text-danger">
          {geocodeError}
        </p>
      )}
    </fieldset>
  )
}