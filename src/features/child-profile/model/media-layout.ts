// Раскладка медиа профиля на устройстве продавца: порядок и главное фото.
// Бэкенд пока не хранит порядок для медиа ребёнка (sortOrder есть только у
// товаров, ProductMedia), поэтому раскладка живёт локально до появления поля.
import type { MediaKind } from '@/shared/domain/media'
import { storage } from '@/shared/lib/storage/web-storage'

export interface MediaLayout {
  photoOrder: string[]
  videoOrder: string[]
  mainPhotoId: string | null
}

const KEY_PREFIX = 'kindis-media-layout:'

const EMPTY_LAYOUT: MediaLayout = { photoOrder: [], videoOrder: [], mainPhotoId: null }

function keyOf(ownerId: string): string {
  return `${KEY_PREFIX}${ownerId}`
}

function parseIds(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((id): id is string => typeof id === 'string') : []
}

function parse(raw: string | null): MediaLayout {
  if (!raw) return EMPTY_LAYOUT
  try {
    const parsed = JSON.parse(raw) as Partial<MediaLayout>
    return {
      photoOrder: parseIds(parsed.photoOrder),
      videoOrder: parseIds(parsed.videoOrder),
      mainPhotoId: typeof parsed.mainPhotoId === 'string' ? parsed.mainPhotoId : null,
    }
  } catch {
    return EMPTY_LAYOUT
  }
}

export function readMediaLayout(ownerId: string): MediaLayout {
  return parse(storage.getItem(keyOf(ownerId)))
}

export function writeMediaLayout(ownerId: string, layout: MediaLayout): MediaLayout {
  storage.setItem(keyOf(ownerId), JSON.stringify(layout))
  return layout
}

// Главное фото профиля — первое в галерее и в предпросмотре витрины.
export function setMainPhoto(ownerId: string, mediaId: string | null): MediaLayout {
  const current = readMediaLayout(ownerId)
  return writeMediaLayout(ownerId, { ...current, mainPhotoId: mediaId })
}

export function moveWithinOrder(
  order: string[],
  mediaId: string,
  direction: 'left' | 'right',
): string[] {
  const index = order.indexOf(mediaId)
  if (index === -1) return order

  const target = direction === 'left' ? index - 1 : index + 1
  if (target < 0 || target >= order.length) return order

  const next = [...order]
  const swapped = next[target]
  next[target] = next[index]
  next[index] = swapped
  return next
}

// Сдвиг файла на одну позицию внутри своего вида (фото или видео).
// displayedIds — то, что сейчас на экране: новые файлы уже попадают в порядок.
export function moveMedia(
  ownerId: string,
  kind: MediaKind,
  mediaId: string,
  direction: 'left' | 'right',
  displayedIds: string[],
): MediaLayout {
  const current = readMediaLayout(ownerId)
  const field = kind === 'photo' ? 'photoOrder' : 'videoOrder'
  return writeMediaLayout(ownerId, {
    ...current,
    [field]: moveWithinOrder(displayedIds, mediaId, direction),
  })
}

// Сортировка по сохранённому порядку; новые файлы добавляются в конец.
export function sortByOrder<T extends { id: string }>(items: T[], order: string[]): T[] {
  const pending = new Map(items.map((item) => [item.id, item]))
  const ordered: T[] = []

  for (const id of order) {
    const item = pending.get(id)
    if (!item) continue
    ordered.push(item)
    pending.delete(id)
  }

  return [...ordered, ...pending.values()]
}

// Главное фото идёт первым, остальные — в сохранённом порядке.
export function withMainFirst<T extends { id: string }>(items: T[], mainId: string | null): T[] {
  if (!mainId) return items

  const mainIndex = items.findIndex((item) => item.id === mainId)
  if (mainIndex === -1) return items

  return [items[mainIndex], ...items.filter((_, index) => index !== mainIndex)]
}
