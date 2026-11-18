import { beforeEach, describe, expect, it } from 'vitest'

import { useSessionStore } from '@/entities/session/model/session-store'
import type { User } from '@/shared/domain/user'

const user: User = {
  id: 'u-1',
  email: 'parent@example.com',
  fullName: 'Мама',
  phone: null,
  city: 'Москва',
  role: 'parent',
}

beforeEach(() => {
  useSessionStore.getState().clearSession()
})

describe('session-store', () => {
  it('стартует анонимной сессией', () => {
    const state = useSessionStore.getState()

    expect(state.user).toBeNull()
    expect(state.status).toBe('anonymous')
    expect(state.hasRole(['parent'])).toBe(false)
  })

  it('setSession пишет пользователя и статус', () => {
    useSessionStore.getState().setSession(user)

    const state = useSessionStore.getState()
    expect(state.user).toEqual(user)
    expect(state.status).toBe('authenticated')
  })

  it('clearSession возвращает анонимность', () => {
    useSessionStore.getState().setSession(user)
    useSessionStore.getState().clearSession()

    const state = useSessionStore.getState()
    expect(state.user).toBeNull()
    expect(state.status).toBe('anonymous')
  })

  it('hasRole проверяет роль текущего пользователя', () => {
    useSessionStore.getState().setSession(user)

    expect(useSessionStore.getState().hasRole(['parent'])).toBe(true)
    expect(useSessionStore.getState().hasRole(['admin'])).toBe(false)
    expect(useSessionStore.getState().hasRole(['buyer', 'parent'])).toBe(true)
  })
})
