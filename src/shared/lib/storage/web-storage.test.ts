// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'

const KEY = 'kindis-test-key'

afterEach(() => {
  vi.unstubAllGlobals()
  vi.resetModules()
})

// Модуль резолвит хранилище на импорте,поэтому каждый случай грузим заново.
async function loadStorage() {
  return (await import('@/shared/lib/storage/web-storage')).storage
}

describe('web-storage', () => {
  it('работает через localStorage,когда он доступен', async () => {
    const storage = await loadStorage()

    storage.setItem(KEY, 'value')

    expect(window.localStorage.getItem(KEY)).toBe('value')
    expect(storage.getItem(KEY)).toBe('value')

    storage.removeItem(KEY)

    expect(storage.getItem(KEY)).toBeNull()
  })

  it('падает в память,когда обращение к localStorage бросает SecurityError', async () => {
    Object.defineProperty(window, 'localStorage', {
      get() {
        throw new Error('SecurityError: доступ запрещён')
      },
      configurable: true,
    })

    const storage = await loadStorage()

    expect(() => storage.setItem(KEY, 'value')).not.toThrow()
    expect(storage.getItem(KEY)).toBe('value')
    storage.removeItem(KEY)
    expect(storage.getItem(KEY)).toBeNull()
  })

  it('падает в память,когда запись в localStorage падает', async () => {
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: () => null,
        setItem: () => {
          throw new Error('QuotaExceededError')
        },
        removeItem: () => undefined,
      },
      configurable: true,
    })

    const storage = await loadStorage()

    expect(() => storage.setItem(KEY, 'value')).not.toThrow()
    // Фолбэк в памяти:значение читается,хоть localStorage и не принял его.
    expect(storage.getItem(KEY)).toBe('value')
  })

  it('без window использует память', async () => {
    vi.stubGlobal('window', undefined)

    const storage = await loadStorage()

    storage.setItem(KEY, 'ssr')

    expect(storage.getItem(KEY)).toBe('ssr')
  })
})