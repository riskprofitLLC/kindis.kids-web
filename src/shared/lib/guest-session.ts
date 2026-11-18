import { storage } from '@/shared/lib/storage/web-storage'

const GUEST_SESSION_KEY = 'kindis-cart-session'

// Идентификатор гостевой корзины:свой на устройство,уходит на бэкенд
// заголовком X-Cart-Session. После входа сливается с пользовательской.
export function getGuestSessionId(): string {
  const existing = storage.getItem(GUEST_SESSION_KEY)
  if (existing) return existing

  const created =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `guest-${Date.now()}-${Math.random().toString(36).slice(2)}`

  storage.setItem(GUEST_SESSION_KEY, created)
  return created
}

// После слияния гостевая корзина больше не нужна — пользовательская своя.
export function clearGuestSessionId(): void {
  storage.removeItem(GUEST_SESSION_KEY)
}
