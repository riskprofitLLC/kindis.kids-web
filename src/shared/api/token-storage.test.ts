import { beforeEach, describe, expect, it } from 'vitest'

import { tokenStorage } from '@/shared/api/token-storage'
import { storage } from '@/shared/lib/storage/web-storage'

const REFRESH_KEY = 'kindis-refresh-token'

describe('tokenStorage', () => {
  beforeEach(() => {
    tokenStorage.clear()
    tokenStorage.clearRefresh()
  })

  it('access-токен живёт в памяти и читается обратно', () => {
    expect(tokenStorage.get()).toBeNull()

    tokenStorage.set('access-1')

    expect(tokenStorage.get()).toBe('access-1')
  })

  it('clear снимает access-токен', () => {
    tokenStorage.set('access-1')
    tokenStorage.clear()

    expect(tokenStorage.get()).toBeNull()
  })

  it('refresh-токен переживает «перезагрузку» через хранилище', () => {
    // Access в памяти теряется, refresh — нет: именно он поднимает сессию.
    tokenStorage.setRefresh('refresh-1')

    expect(storage.getItem(REFRESH_KEY)).toBe('refresh-1')
    expect(tokenStorage.getRefresh()).toBe('refresh-1')

    tokenStorage.clearRefresh()

    expect(tokenStorage.getRefresh()).toBeNull()
  })

  it('неиспользованный refresh читается как null', () => {
    expect(tokenStorage.getRefresh()).toBeNull()
  })
})
