import axios, { AxiosError } from 'axios'

import { authEvents } from '@/shared/api/auth-events'
import { ApiError } from '@/shared/api/errors'
import { tokenStorage } from '@/shared/api/token-storage'
import { env } from '@/shared/config/env'
import { getGuestSessionId } from '@/shared/lib/guest-session'

const REFRESH_URL = '/auth/refresh'

// Single-flight:параллельные 401 делят один промис обновления,иначе каждый
// запрос сам по себе ротирует refresh-токен и ломает сессию.
let refreshInFlight: Promise<string> | null = null
// Один упавший refresh на всю пачку ожидавших:без дубля события истёкшей сессии.
let expiredNotified = false

interface ApiEnvelope<T> {
  data: T
  traceId?: string
}

export const api = axios.create({
  baseURL: env.apiUrl,
  withCredentials: true,
})

api.interceptors.request.use((config) => {
  const token = tokenStorage.get()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  // Гостевая корзина опознаётся по этому заголовку；авторизованному он не нужен.
  if (!token) {
    config.headers['X-Cart-Session'] = getGuestSessionId()
  }
  return config
})

api.interceptors.response.use(
  // Бэкенд заворачивает успешные ответы в { data, traceId } — разворачиваем здесь,
  // чтобы вся остальная кодовая база работала с «чистыми» данными.
  (response) => {
    const body = response.data as ApiEnvelope<unknown> | null
    if (body && typeof body === 'object' && 'data' in body) {
      response.data = body.data
    }
    return response
  },
  async (
    error: AxiosError<{ message?: string; code?: string; fields?: Record<string, string> }>,
  ) => {
    const original = error.config as (typeof error.config & { _retried?: boolean }) | undefined
    const status = error.response?.status

    // Один раз пробуем обновить access и повторить исходный запрос
    if (status === 401 && original && !original._retried && original.url !== REFRESH_URL) {
      original._retried = true
      if (!tokenStorage.getRefresh()) {
        return Promise.reject(toApiError(error))
      }
      try {
        const accessToken = await requestRefresh()
        original.headers.Authorization = `Bearer ${accessToken}`
        return api(original)
      } catch {
        if (!expiredNotified) {
          expiredNotified = true
          tokenStorage.clear()
          tokenStorage.clearRefresh()
          authEvents.emitExpired()
        }
      }
    }

    return Promise.reject(toApiError(error))
  },
)

// Общий промис обновления:второй параллельный 401 ждёт его же,а не шлёт свой refresh.
async function requestRefresh(): Promise<string> {
  refreshInFlight ??= (async () => {
    try {
      const { data } = await api.post<{ accessToken: string; refreshToken: string }>(
        REFRESH_URL,
        { refreshToken: tokenStorage.getRefresh() },
      )
      tokenStorage.set(data.accessToken)
      tokenStorage.setRefresh(data.refreshToken)
      expiredNotified = false
      return data.accessToken
    } finally {
      // Промис уже захвачен ожидающими — сброс только для следующих 401.
      refreshInFlight = null
    }
  })()
  return refreshInFlight
}

function toApiError(
  error: AxiosError<{ message?: string; code?: string; fields?: Record<string, string> }>,
): ApiError {
  const data = error.response?.data
  if (error.code === 'ERR_NETWORK') {
    return new ApiError('Нет связи с сервером. Проверьте подключение к интернету.', 0)
  }
  return new ApiError(
    data?.message ?? 'Что-то пошло не так. Попробуйте ещё раз.',
    error.response?.status ?? 0,
    data?.code,
    data?.fields,
  )
}
