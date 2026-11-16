import { describe, expect, it } from 'vitest'

import { CITY_COORDS, cityCoords, nearestCity, POPULAR_CITIES } from '@/features/map/lib/city-coords'

describe('CITY_COORDS', () => {
  it('содержит города из сид-данных каталога', () => {
    expect(CITY_COORDS).toHaveProperty('Москва')
    expect(CITY_COORDS).toHaveProperty('Сочи')
  })

  it('все координаты в границах России', () => {
    for (const [city, [lat, lng]] of Object.entries(CITY_COORDS)) {
      expect(lat, city).toBeGreaterThan(41)
      expect(lat, city).toBeLessThan(82)
      expect(lng, city).toBeGreaterThan(19)
      expect(lng, city).toBeLessThan(180)
    }
  })

  it('список популярных городов не пустой и без дублей', () => {
    expect(POPULAR_CITIES.length).toBeGreaterThan(0)
    expect(new Set(POPULAR_CITIES).size).toBe(POPULAR_CITIES.length)
  })
})

describe('cityCoords', () => {
  it('возвращает координаты известного города', () => {
    expect(cityCoords('Москва')).toEqual([55.7558, 37.6173])
  })

  it('неизвестный город и пустота дают null', () => {
    expect(cityCoords('Луна')).toBeNull()
    expect(cityCoords(null)).toBeNull()
    expect(cityCoords(undefined)).toBeNull()
    expect(cityCoords('')).toBeNull()
  })

  it('чувствителен к регистру — справвочник точный', () => {
    expect(cityCoords('москва')).toBeNull()
  })
})

describe('nearestCity', () => {
  it('точка в Москве отвечает Москвой', () => {
    expect(nearestCity(55.75, 37.62)).toBe('Москва')
  })

  it('точка в Сочи отвечает Сочи', () => {
    expect(nearestCity(43.6, 39.73)).toBe('Сочи')
  })

  it('точка между городами выбирает ближайший по евклиду', () => {
    // Между Москвой и Питером ближе к Питеру.
    const city = nearestCity(59.5, 30.5)
    expect(city).toBeTruthy()
    expect(['Санкт-Петербург']).toContain(city)
  })
})