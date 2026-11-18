// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useSessionStore } from '@/entities/session/model/session-store'
import { useLogin, useLogout } from '@/features/auth/model/use-auth'
import type { User } from '@/shared/domain/user'

const login = vi.fn()
const logout = vi.fn()
const mergeWithSession = vi.fn()

vi.mock('@/shared/api/auth-api', () => ({
  authApi: {
    login: (...args: unknown[]) => login(...args),
    logout: (...args: unknown[]) => logout(...args),
  },
}))
vi.mock('@/shared/api/cart-api', () => ({
  cartApi: {
    mergeWithSession: (...args: unknown[]) => mergeWithSession(...args),
  },
}))
vi.mock('@/shared/lib/guest-session', () => ({
  getGuestSessionId: vi.fn(() => 'guest-1'),
  clearGuestSessionId: vi.fn(),
}))

const user: User = {
  id: 'u-1',
  email: 'parent@example.com',
  fullName: 'Мама',
  phone: null,
  city: 'Москва',
  role: 'parent',
}

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}

beforeEach(() => {
  useSessionStore.getState().clearSession()
  vi.clearAllMocks()
})

describe('useLogin', () => {
  it('успешный вход пишет пользователя в сессию', async () => {
    login.mockResolvedValueOnce(user)
    mergeWithSession.mockResolvedValueOnce(undefined)

    const { result } = renderHook(() => useLogin(), { wrapper })

    await act(async () => {
      await result.current.mutateAsync({ email: user.email, password: 'secret' })
    })

    expect(login).toHaveBeenCalledWith(user.email, 'secret')
    expect(useSessionStore.getState().user).toEqual(user)
    expect(useSessionStore.getState().status).toBe('authenticated')
  })

  it('после входа гостевая корзина сливается с пользовательской', async () => {
    login.mockResolvedValueOnce(user)
    mergeWithSession.mockResolvedValueOnce(undefined)

    const { result } = renderHook(() => useLogin(), { wrapper })

    await act(async () => {
      await result.current.mutateAsync({ email: user.email, password: 'secret' })
    })

    await waitFor(() => expect(mergeWithSession).toHaveBeenCalledWith('guest-1'))
  })

  it('сбой сети не пишет сессию и отдаёт ошибку', async () => {
    login.mockRejectedValueOnce(new Error('Нет связи'))

    const { result } = renderHook(() => useLogin(), { wrapper })

    await act(async () => {
      await expect(
        result.current.mutateAsync({ email: user.email, password: 'wrong' }),
      ).rejects.toThrow('Нет связи')
    })

    expect(useSessionStore.getState().user).toBeNull()
    expect(mergeWithSession).not.toHaveBeenCalled()
  })

  it('неудачное слияние корзины не ломает вход', async () => {
    login.mockResolvedValueOnce(user)
    mergeWithSession.mockRejectedValueOnce(new Error('слияние упало'))

    const { result } = renderHook(() => useLogin(), { wrapper })

    await act(async () => {
      await result.current.mutateAsync({ email: user.email, password: 'secret' })
    })

    // Сессия уже написана — корзина догонит позже.
    expect(useSessionStore.getState().user).toEqual(user)
  })
})

describe('useLogout', () => {
  it('чистит сессию после успешного выхода', async () => {
    useSessionStore.getState().setSession(user)
    logout.mockResolvedValueOnce(undefined)

    const { result } = renderHook(() => useLogout(), { wrapper })

    await act(async () => {
      await result.current.mutateAsync()
    })

    expect(useSessionStore.getState().user).toBeNull()
    expect(useSessionStore.getState().status).toBe('anonymous')
  })

  it('чистит сессию даже при сетевом сбое logout', async () => {
    useSessionStore.getState().setSession(user)
    logout.mockRejectedValueOnce(new Error('Нет связи'))

    const { result } = renderHook(() => useLogout(), { wrapper })

    await act(async () => {
      await expect(result.current.mutateAsync()).rejects.toThrow('Нет связи')
    })

    // Локальные токены снимаются всегда — иначе пользователь «залипнет» в кабинете.
    expect(useSessionStore.getState().user).toBeNull()
  })
})
