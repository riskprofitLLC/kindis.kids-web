import { useEffect, useSyncExternalStore } from 'react'

import { mediaApi } from '@/shared/api/media-api'

// Presigned-ссылки живут ограниченное время (бэкенд подписывает их на час),
// поэтому кешируем с TTL и перезапрашиваем по истечении — иначе картинки ломаются.
const TTL_MS = 5 * 60 * 1000

interface CacheEntry {
  url: string
  expiresAt: number
}

const cache = new Map<string, CacheEntry>()
const pending = new Map<string, Promise<string>>()
const listeners = new Set<() => void>()
const timers = new Map<string, ReturnType<typeof setTimeout>>()
// Медиа,для которого уже пробовали обновить ссылку после ошибки загрузки.
const renewed = new Set<string>()

function notify(): void {
  listeners.forEach((listener) => listener())
}

// Просроченная запись выкидываем — следующее чтение пойдёт за свежей ссылкой.
function peek(mediaId: string): string | null {
  const entry = cache.get(mediaId)
  if (!entry) return null
  if (entry.expiresAt <= Date.now()) {
    cache.delete(mediaId)
    return null
  }
  return entry.url
}

// По истечении TTL сами себя обновляем: страница может быть открыта долго.
function scheduleRefresh(mediaId: string): void {
  const previous = timers.get(mediaId)
  if (previous) clearTimeout(previous)
  timers.set(
    mediaId,
    setTimeout(() => {
      timers.delete(mediaId)
      void resolveUrl(mediaId).catch(() => undefined)
    }, TTL_MS),
  )
}

async function load(mediaId: string, fromError = false): Promise<string> {
  const url = await mediaApi.getReadUrl(mediaId)
  cache.set(mediaId, { url, expiresAt: Date.now() + TTL_MS })
  // Штатное обновление снимает запрет повтора — попытка по ошибке нет.
  if (!fromError) renewed.delete(mediaId)
  scheduleRefresh(mediaId)
  notify()
  return url
}

async function resolveUrl(mediaId: string): Promise<string> {
  const cached = peek(mediaId)
  if (cached) return cached

  const inFlight = pending.get(mediaId)
  if (inFlight) return inFlight

  const request = load(mediaId).finally(() => pending.delete(mediaId))
  pending.set(mediaId, request)
  return request
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

const emptyUrl = (): null => null

export function useMediaUrl(mediaId: string | null | undefined): string | null {
  const url = useSyncExternalStore(
    subscribe,
    mediaId ? () => peek(mediaId) : emptyUrl,
    emptyUrl,
  )

  useEffect(() => {
    if (!mediaId) return
    void resolveUrl(mediaId).catch(() => undefined)
  }, [mediaId])

  return url
}

// Один раз просим свежую ссылку — вызываем из onError у <img>/<video>,
// когда presigned протух раньше нашего TTL или хранилище его отозвало.
export async function renewMediaUrl(mediaId: string | null | undefined): Promise<void> {
  if (!mediaId || renewed.has(mediaId)) return
  renewed.add(mediaId)
  try {
    await load(mediaId, true)
  } catch {
    // Не удалось — оставляем как есть,чтобы не долбить хранилище в цикле.
  }
}
