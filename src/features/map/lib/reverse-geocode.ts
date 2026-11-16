// Обратное геокодирование точки в адрес через Nominatim (OSM).
// В dev идёт через прокси vite，в проде — напрямую；любая ошибка отдаёт null，
// и продавец добирает адрес вручную.

const NOMINATIM_URL = import.meta.env.DEV
  ? '/nominatim/reverse'
  : 'https://nominatim.openstreetmap.org/reverse'

const TIMEOUT_MS = 8000

export async function reverseGeocode(
  latitude: number,
  longitude: number,
): Promise<string | null> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)

  try {
    const url =
      `${NOMINATIM_URL}?format=jsonv2&zoom=18&addressdetails=0` +
      `&lat=${encodeURIComponent(latitude)}&lon=${encodeURIComponent(longitude)}`
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    })
    if (!response.ok) return null

    const data = (await response.json()) as { display_name?: string; error?: string }
    const address = data.display_name?.trim()
    return address ? address : null
  } catch {
    return null
  } finally {
    clearTimeout(timer)
  }
}