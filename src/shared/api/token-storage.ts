import { storage } from '@/shared/lib/storage/web-storage'

const REFRESH_KEY = 'kindis-refresh-token'

// Access-токен живёт только в памяти: при перезагрузке его поднимает refresh.
let accessToken: string | null = null

// Бэкенд принимает refresh только в теле запроса (httpOnly-cookie не выдаёт),
// поэтому храним его в localStorage — осознанный риск XSS, см. PLAN.md.
export const tokenStorage = {
  get(): string | null {
    return accessToken
  },
  set(token: string): void {
    accessToken = token
  },
  clear(): void {
    accessToken = null
  },
  getRefresh(): string | null {
    return storage.getItem(REFRESH_KEY)
  },
  setRefresh(token: string): void {
    storage.setItem(REFRESH_KEY, token)
  },
  clearRefresh(): void {
    storage.removeItem(REFRESH_KEY)
  },
}
