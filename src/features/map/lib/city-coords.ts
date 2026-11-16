// Статический справочник «город → координаты» для карты каталога.
// Покрывает популярные города РФ из сид-данных и выдачи; без внешних геокодеров.
export const CITY_COORDS: Record<string, [number, number]> = {
  Москва: [55.7558, 37.6173],
  'Санкт-Петербург': [59.9343, 30.3351],
  Сочи: [43.6028, 39.7342],
  Новосибирск: [55.0084, 82.9357],
  Екатеринбург: [56.8389, 60.6057],
  Казань: [55.7963, 49.1088],
  'Нижний Новгород': [56.3269, 44.0059],
  Челябинск: [55.1644, 61.4368],
  Самара: [53.1959, 50.1002],
  'Ростов-на-Дону': [47.2357, 39.7015],
}

export const POPULAR_CITIES = Object.keys(CITY_COORDS)

// Координаты города или null — на карту попадают только известные города.
export function cityCoords(city: string | null | undefined): [number, number] | null {
  if (!city) return null
  return CITY_COORDS[city] ?? null
}

// Ближайший город из справочника к точке — для кнопки «Ближайшие ко мне».
export function nearestCity(lat: number, lng: number): string | null {
  let best: string | null = null
  let bestDistance = Number.POSITIVE_INFINITY

  for (const [city, [cityLat, cityLng]] of Object.entries(CITY_COORDS)) {
    const distance = (cityLat - lat) ** 2 + (cityLng - lng) ** 2
    if (distance < bestDistance) {
      bestDistance = distance
      best = city
    }
  }

  return best
}