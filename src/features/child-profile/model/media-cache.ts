import type { MediaAsset } from '@/shared/api/media-api'
import { storage } from '@/shared/lib/storage/web-storage'

// Временный мост до появления на бэкенде выборки медиа по владельцу:
// после загрузки кладём метаданные в localStorage по профилю.
// Удаление на другом устройстве не подхватится — поэтому галерея
// дополнительно перепроверяет доступность каждой ссылки.
const KEY_PREFIX = 'kindis-media-cache:'

function keyOf(ownerId: string): string {
  return `${KEY_PREFIX}${ownerId}`
}

export function readCachedMedia(ownerId: string): MediaAsset[] {
  const raw = storage.getItem(keyOf(ownerId))
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw) as MediaAsset[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function writeCachedMedia(ownerId: string, assets: MediaAsset[]): void {
  storage.setItem(keyOf(ownerId), JSON.stringify(assets))
}

export function addCachedMedia(ownerId: string, asset: MediaAsset): MediaAsset[] {
  const next = [...readCachedMedia(ownerId).filter((item) => item.id !== asset.id), asset]
  writeCachedMedia(ownerId, next)
  return next
}

export function removeCachedMedia(ownerId: string, mediaId: string): MediaAsset[] {
  const next = readCachedMedia(ownerId).filter((item) => item.id !== mediaId)
  writeCachedMedia(ownerId, next)
  return next
}

export function patchCachedMedia(
  ownerId: string,
  mediaId: string,
  patch: Partial<MediaAsset>,
): MediaAsset[] {
  const next = readCachedMedia(ownerId).map((item) =>
    item.id === mediaId ? { ...item, ...patch } : item,
  )
  writeCachedMedia(ownerId, next)
  return next
}
