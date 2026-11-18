import { beforeEach, describe, expect, it, vi } from 'vitest'

import { tokenStorage } from '@/shared/api/token-storage'

const post = vi.fn()

vi.mock('@/shared/api/client', () => ({
  api: {
    post: (...args: unknown[]) => post(...args),
    get: vi.fn(),
  },
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

const { authApi } = await import('@/shared/api/auth-api')

// Реальный токен бэкенда: payload { sub, email, role }
const accessToken =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIwN2U1NmQ4NS05NDY5LTQzMWEtYTI4ZS00YTVi' +
  'YThiZmU5MDciLCJlbWFpbCI6InRlc3RAZXhhbXBsZS5jb20iLCJyb2xlIjoicGFyZW50IiwiaWF0IjoxN' +
  'zk0NTYyNzgyLCJleHAiOjE3OTQ1NjM2ODJ9.XOyQvpQP37RTbq7znmtmT8Xy-ldIrPi1JldRVDysvSE'

beforeEach(() => {
  vi.clearAllMocks()
})

describe('authApi.login', () => {
  it('сохраняет пару токенов и собирает пользователя из claims', async () => {
    post.mockResolvedValueOnce({ data: { accessToken, refreshToken: 'refresh-1' } })

    const user = await authApi.login('test@example.com', 'secret')

    expect(post).toHaveBeenCalledWith('/auth/login', {
      email: 'test@example.com',
      password: 'secret',
    })
    expect(tokenStorage.set).toHaveBeenCalledWith(accessToken)
    expect(tokenStorage.setRefresh).toHaveBeenCalledWith('refresh-1')
    expect(user).toMatchObject({
      id: '07e56d85-9469-431a-a28e-4a5ba8bfe907',
      email: 'test@example.com',
      role: 'parent',
    })
  })

  it('нечитаемый токен не пускает в сессию', async () => {
    post.mockResolvedValueOnce({ data: { accessToken: 'мусор', refreshToken: 'r' } })

    await expect(authApi.login('test@example.com', 'secret')).rejects.toThrow(
      'Не удалось прочитать токен сессии',
    )
  })
})

describe('authApi.register', () => {
  it('возвращает userId без сохранения токенов', async () => {
    post.mockResolvedValueOnce({ data: { userId: 'u-9' } })

    const result = await authApi.register({
      email: 'new@example.com',
      password: 'secret',
      fullName: 'Новый',
    })

    expect(result).toEqual({ userId: 'u-9' })
    expect(tokenStorage.set).not.toHaveBeenCalled()
  })
})

describe('authApi.restoreSession', () => {
  it('без refresh-токена сразу отдаёт null', async () => {
    vi.mocked(tokenStorage.getRefresh).mockReturnValueOnce(null)

    await expect(authApi.restoreSession()).resolves.toBeNull()
    expect(post).not.toHaveBeenCalled()
  })

  it('обменивает refresh на новую пару и поднимает пользователя', async () => {
    vi.mocked(tokenStorage.getRefresh).mockReturnValueOnce('refresh-1')
    post.mockResolvedValueOnce({ data: { accessToken, refreshToken: 'refresh-2' } })

    const user = await authApi.restoreSession()

    expect(post).toHaveBeenCalledWith('/auth/refresh', { refreshToken: 'refresh-1' })
    expect(tokenStorage.setRefresh).toHaveBeenCalledWith('refresh-2')
    expect(user?.email).toBe('test@example.com')
  })

  it('просроченный refresh чистит хранилище и даёт null', async () => {
    vi.mocked(tokenStorage.getRefresh).mockReturnValueOnce('refresh-dead')
    post.mockRejectedValueOnce(new Error('401'))

    await expect(authApi.restoreSession()).resolves.toBeNull()
    expect(tokenStorage.clear).toHaveBeenCalled()
    expect(tokenStorage.clearRefresh).toHaveBeenCalled()
  })
})

describe('authApi.logout', () => {
  it('шлёт refresh на сервер и чистит токены', async () => {
    vi.mocked(tokenStorage.getRefresh).mockReturnValueOnce('refresh-1')
    post.mockResolvedValueOnce({ data: null })

    await authApi.logout()

    expect(post).toHaveBeenCalledWith('/auth/logout', { refreshToken: 'refresh-1' })
    expect(tokenStorage.clear).toHaveBeenCalled()
  })

  it('чистит токены даже когда сервер недоступен', async () => {
    vi.mocked(tokenStorage.getRefresh).mockReturnValueOnce(null)
    post.mockRejectedValueOnce(new Error('Нет связи'))

    await authApi.logout().catch(() => {})

    // finally снимает локальные токены при любом исходе.
    expect(tokenStorage.clear).toHaveBeenCalled()
  })
})

describe('authApi.forgotPassword / resetPassword', () => {
  it('отправляют код и новый пароль', async () => {
    post.mockResolvedValue({ data: null })

    await authApi.forgotPassword('test@example.com')
    await authApi.resetPassword('test@example.com', '123456', 'new-secret')

    expect(post).toHaveBeenNthCalledWith(1, '/auth/forgot-password', {
      email: 'test@example.com',
    })
    expect(post).toHaveBeenNthCalledWith(2, '/auth/reset-password', {
      email: 'test@example.com',
      code: '123456',
      password: 'new-secret',
    })
  })
})
