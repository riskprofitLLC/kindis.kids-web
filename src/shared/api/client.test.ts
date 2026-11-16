import {
  AxiosError,
  AxiosHeaders,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { authEvents } from '@/shared/api/auth-events'
import { ApiError } from '@/shared/api/errors'
import { tokenStorage } from '@/shared/api/token-storage'

vi.mock('@/shared/config/env', () => ({ env: { apiUrl: 'http://api.test/api/v1' } }))
vi.mock('@/shared/lib/guest-session', () => ({
  getGuestSessionId: vi.fn(() => 'guest-session-1'),
  clearGuestSessionId: vi.fn(),
}))
vi.mock('@/shared/api/auth-events', () => ({
  authEvents: { emitExpired: vi.fn(), onExpired: vi.fn(() => () => {}) },
}))
vi.mock('@/shared/api/token-storage', () => ({
  tokenStorage: {
    get: vi.fn(() => null),
    set: vi.fn(),
    clear: vi.fn(),
    getRefresh: vi.fn(() => null),
    setRefresh: vi.fn(),
    clearRefresh: vi.fn(),
  },
}))

const { api } = await import('@/shared/api/client')

type Config = InternalAxiosRequestConfig

let requests: Config[] = []
let responder: (config: Config) => AxiosResponse

function ok(config: Config, data: unknown): AxiosResponse {
  return { data, status: 200, statusText: 'OK', headers: new AxiosHeaders(), config }
}

function fail(config: Config, status: number, data?: unknown): never {
  throw new AxiosError('boom', 'ERR_BAD_RESPONSE', config, {}, {
    data,
    status,
    statusText: String(status),
    headers: new AxiosHeaders(),
    config,
  })
}

beforeEach(() => {
  requests = []
  responder = (config) => ok(config, {})
  api.defaults.adapter = async (config) => {
    requests.push(config)
    return responder(config)
  }
})

describe('request interceptor', () => {
  it('подставляет Bearer-токен из tokenStorage', async () => {
    vi.mocked(tokenStorage.get).mockReturnValueOnce('access-1')

    await api.get('/catalog')

    expect(requests[0].headers.Authorization).toBe('Bearer access-1')
  })

  it('гостю добавляет X-Cart-Session', async () => {
    await api.get('/cart')

    expect(requests[0].headers['X-Cart-Session']).toBe('guest-session-1')
  })

  it('авторизованному гостевой заголовок не нужен', async () => {
    vi.mocked(tokenStorage.get).mockReturnValueOnce('access-1')

    await api.get('/cart')

    expect(requests[0].headers['X-Cart-Session']).toBeUndefined()
  })
})

describe('response interceptor — конверт бэкенда', () => {
  it('разворачивает { data, traceId } до полезной нагрузки', async () => {
    responder = (config) => ok(config, { data: { items: [1, 2] }, traceId: 't-1' })

    const response = await api.get('/catalog')

    expect(response.data).toEqual({ items: [1, 2] })
  })

  it('тело без конверта проходит как есть', async () => {
    responder = (config) => ok(config, { message: 'pong' })

    const response = await api.get('/ping')

    expect(response.data).toEqual({ message: 'pong' })
  })
})

describe('response interceptor — ошибки', () => {
  it('сообщение и код сервера попадают в ApiError', async () => {
    responder = (config) =>
      fail(config, 409, { message: 'Товар закончился', code: 'OUT_OF_STOCK' })

    const error = await api.get('/cart').catch((caught) => caught)

    expect(error).toBeInstanceOf(ApiError)
    expect(error.message).toBe('Товар закончился')
    expect(error.status).toBe(409)
    expect(error.code).toBe('OUT_OF_STOCK')
  })

  it('поля валидации пробрасываются насквозь', async () => {
    responder = (config) =>
      fail(config, 422, { message: 'Валидация', fields: { email: 'Занят' } })

    const error = await api.post('/auth/register').catch((caught) => caught)

    expect(error.fields).toEqual({ email: 'Занят' })
  })

  it('без сообщения — дружелюбный дефолт', async () => {
    responder = (config) => fail(config, 500)

    const error = await api.get('/catalog').catch((caught) => caught)

    expect(error.message).toBe('Что-то пошло не так. Попробуйте ещё раз.')
    expect(error.status).toBe(500)
  })

  it('сетевой сбой даёт статус 0 и свой текст', async () => {
    responder = (config) => {
      throw new AxiosError('network down', 'ERR_NETWORK', config)
    }

    const error = await api.get('/catalog').catch((caught) => caught)

    expect(error.status).toBe(0)
    expect(error.message).toContain('Нет связи')
  })
})

describe('response interceptor — обновление сессии по 401', () => {
  it('успешный refresh повторяет исходный запрос с новым токеном', async () => {
    vi.mocked(tokenStorage.getRefresh).mockReturnValue('refresh-1')
    responder = (config) => {
      if (config.url === '/auth/refresh') {
        return ok(config, { accessToken: 'new-access', refreshToken: 'new-refresh' })
      }
      if (requests.length === 1) fail(config, 401)
      return ok(config, { data: { items: [] }, traceId: 't-2' })
    }

    const response = await api.get('/catalog')

    expect(response.data).toEqual({ items: [] })
    // Исходный запрос, refresh и повтор — три вызова адаптера.
    expect(requests).toHaveLength(3)
    expect(tokenStorage.set).toHaveBeenCalledWith('new-access')
    expect(tokenStorage.setRefresh).toHaveBeenCalledWith('new-refresh')
    expect(requests[2].headers.Authorization).toBe('Bearer new-access')
  })

  it('без refresh-токена сразу отдаёт ApiError 401', async () => {
    vi.mocked(tokenStorage.getRefresh).mockReturnValue(null)
    responder = (config) => fail(config, 401)

    const error = await api.get('/catalog').catch((caught) => caught)

    expect(error).toBeInstanceOf(ApiError)
    expect(error.status).toBe(401)
    // Повтор не attempted — только исходный запрос.
    expect(requests).toHaveLength(1)
  })

  it('неудачный refresh чистит токены и сообщает об истечении сессии', async () => {
    vi.mocked(tokenStorage.getRefresh).mockReturnValue('refresh-1')
    responder = (config) => {
      if (config.url === '/auth/refresh') fail(config, 401, { message: 'Refresh истёк' })
      fail(config, 401)
    }

    const error = await api.get('/catalog').catch((caught) => caught)

    expect(error.status).toBe(401)
    expect(tokenStorage.clear).toHaveBeenCalled()
    expect(tokenStorage.clearRefresh).toHaveBeenCalled()
    expect(authEvents.emitExpired).toHaveBeenCalledTimes(1)
  })

  it('401 на самом refresh не пытается обновиться повторно', async () => {
    vi.mocked(tokenStorage.getRefresh).mockReturnValue(null)
    responder = (config) => fail(config, 401, { message: 'Refresh истёк' })

    const error = await api.post('/auth/refresh').catch((caught) => caught)

    expect(error.status).toBe(401)
    expect(requests).toHaveLength(1)
  })
})