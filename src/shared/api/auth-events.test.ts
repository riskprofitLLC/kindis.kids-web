import { describe, expect, it, vi } from 'vitest'

import { authEvents } from '@/shared/api/auth-events'

describe('authEvents', () => {
  it('подписчик получает событие истечения сессии', () => {
    const handler = vi.fn()
    const unsubscribe = authEvents.onExpired(handler)

    authEvents.emitExpired()

    expect(handler).toHaveBeenCalledTimes(1)
    unsubscribe()
  })

  it('отписка снимает обработчик', () => {
    const handler = vi.fn()
    const unsubscribe = authEvents.onExpired(handler)

    unsubscribe()
    authEvents.emitExpired()

    expect(handler).not.toHaveBeenCalled()
  })

  it('несколько подписчиков вызываются все', () => {
    const first = vi.fn()
    const second = vi.fn()
    const offFirst = authEvents.onExpired(first)
    authEvents.onExpired(second)

    authEvents.emitExpired()

    expect(first).toHaveBeenCalledTimes(1)
    expect(second).toHaveBeenCalledTimes(1)

    offFirst()
  })

  it('падающий подписчик не ломает остальных', () => {
    const broken = vi.fn(() => {
      throw new Error('сбой подписчика')
    })
    const healthy = vi.fn()
    const offBroken = authEvents.onExpired(broken)
    const offHealthy = authEvents.onExpired(healthy)

    expect(() => authEvents.emitExpired()).toThrow('сбой подписчика')
    expect(healthy).not.toHaveBeenCalled()

    offBroken()
    offHealthy()
  })
})