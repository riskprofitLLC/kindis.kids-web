import { useEffect, useState } from 'react'

import { mediaApi } from '@/shared/api/media-api'

// Ссылки на чтение живут недолго, поэтому кешируем только на время сессии
// и склеиваем параллельные запросы одного медиа в один.
const cache = new Map<string, string>()
const pending = new Map<string, Promise<string>>()

async function resolveUrl(mediaId: string): Promise<string> {
  const cached = cache.get(mediaId)
  if (cached) return cached

  const inFlight = pending.get(mediaId)
  if (inFlight) return inFlight

  const request = mediaApi
    .getReadUrl(mediaId)
    .then((url) => {
      cache.set(mediaId, url)
      return url
    })
    .finally(() => pending.delete(mediaId))

  pending.set(mediaId, request)
  return request
}

export function useMediaUrl(mediaId: string | null | undefined): string | null {
  const [activeMediaId, setActiveMediaId] = useState(mediaId)
  const [url, setUrl] = useState<string | null>(() =>
    mediaId ? cache.get(mediaId) ?? null : null,
  )

  // Смена медиа во время рендера — сбрасываем состояние (документированный паттерн).
  if (activeMediaId !== mediaId) {
    setActiveMediaId(mediaId)
    setUrl(mediaId ? cache.get(mediaId) ?? null : null)
  }

  useEffect(() => {
    if (!mediaId) return

    let active = true

    resolveUrl(mediaId)
      .then((resolved) => {
        if (active) setUrl(resolved)
      })
      .catch(() => {
        if (active) setUrl(null)
      })

    return () => {
      active = false
    }
  }, [mediaId])

  return url
}
