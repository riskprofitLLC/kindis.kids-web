import { afterEach, describe, expect, it, vi } from 'vitest'

import { clearGuestSessionId, getGuestSessionId } from '@/shared/lib/guest-session'
import { storage } from '@/shared/lib/storage/web-storage'

const KEY = 'kindis-cart-session'

afterEach(() => {
  clearGuestSessionId()
  vi.unstubAllGlobals()
})

describe('getGuestSessionId', () => {
  it('создаёт идентификатор и запоминает его', () => {
    const first = getGuestSessionId()

    expect(first).toBeTruthy()
    expect(storage.getItem(KEY)).toBe(first)
    // Второй чтение отдаёт тот же идентификатор — корзина не теряется.
    expect(getGuestSessionId()).toBe(first)
  })

  it('идентификатор выглядит как uuid', () => {
    expect(getGuestSessionId()).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/)
  })

  it('без crypto.randomUUID падает на резервный генератор', () => {
    vi.stubGlobal('crypto', undefined)

    const fallback = getGuestSessionId()

    expect(fallback).toMatch(/^guest-\d+-[a-z0-9]+$/)
    expect(storage.getItem(KEY)).toBe(fallback)
  })
})

describe('clearGuestSessionId', () => {
  it('удаляет сохранённый идентификатор', () => {
    getGuestSessionId()
    clearGuestSessionId()

    expect(storage.getItem(KEY)).toBeNull()
  })

  it('на чистом хранилище не падает', () => {
    expect(() => clearGuestSessionId()).not.toThrow()
  })
})