import { storage } from '@/shared/lib/storage/web-storage'

const RECENT_KEY = 'kindis-recent-products'
const RECENT_LIMIT = 8

export interface RecentProduct {
  id: string
  title: string
}

function isRecentProduct(value: unknown): value is RecentProduct {
  if (typeof value !== 'object' || value === null) return false
  const item = value as Partial<RecentProduct>
  return typeof item.id === 'string' && item.id.length > 0 && typeof item.title === 'string'
}

// Битые или устаревшие записи молча отбрасываем — список не ломает страницу.
function read(): RecentProduct[] {
  const raw = storage.getItem(RECENT_KEY)
  if (!raw) return []

  try {
    const parsed: unknown = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.filter(isRecentProduct) : []
  } catch {
    return []
  }
}

function write(items: RecentProduct[]): void {
  storage.setItem(RECENT_KEY, JSON.stringify(items.slice(0, RECENT_LIMIT)))
}

// Просмотренный товар уходит на первое место, повторный просмотр не дублирует его.
export function addRecent(product: RecentProduct): RecentProduct[] {
  if (!product?.id) return read()

  const rest = read().filter((item) => item.id !== product.id)
  const next = [{ id: product.id, title: product.title }, ...rest].slice(0, RECENT_LIMIT)

  write(next)
  return next
}

export function listRecent(): RecentProduct[] {
  return read()
}

export function clearRecent(): void {
  storage.removeItem(RECENT_KEY)
}