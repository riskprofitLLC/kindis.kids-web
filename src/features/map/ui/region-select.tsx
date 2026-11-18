import { useState } from 'react'

import { nearestCity, POPULAR_CITIES } from '@/features/map/lib/city-coords'

interface RegionSelectProps {
  value: string
  onChange: (city: string | null) => void
}

// Фильтр по региону: популярные города + «Ближайшие ко мне» через геолокацию.
export function RegionSelect({ value, onChange }: RegionSelectProps) {
  const [geoDenied, setGeoDenied] = useState(false)

  const handleNearMe = () => {
    if (!('geolocation' in navigator)) {
      setGeoDenied(true)
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setGeoDenied(false)
        onChange(nearestCity(position.coords.latitude, position.coords.longitude))
      },
      () => setGeoDenied(true),
    )
  }

  return (
    <label className="flex items-center gap-2 text-sm text-text">
      Регион:
      <select
        className="min-h-11 rounded-md border border-border bg-surface px-2 py-1 text-sm"
        value={value}
        onChange={(event) => {
          const next = event.target.value
          if (next === '__near__') {
            handleNearMe()
            return
          }
          setGeoDenied(false)
          onChange(next === '' ? null : next)
        }}
      >
        <option value="">Все регионы</option>
        {POPULAR_CITIES.map((city) => (
          <option key={city} value={city}>
            {city.replace('-', ' ')}
          </option>
        ))}
        <option value="__near__">Ближайшие ко мне</option>
      </select>
      {/* Плейсхолдер, если геолокация недоступна или запрещена */}
      {geoDenied && (
        <span className="text-xs text-text-muted">Геолокация недоступна — выберите город</span>
      )}
    </label>
  )
}
