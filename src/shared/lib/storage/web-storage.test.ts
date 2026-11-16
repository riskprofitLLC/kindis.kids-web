// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'

import { storage } from '@/shared/lib/storage/web-storage'

describe('storage — ветка localStorage', () => {
  it('читает и пишет через window.localStorage', () => {
    storage.setItem('kindis-test-key', 'значение')

    expect(window.localStorage.getItem('kindis-test-key')).toBe('значение')
    expect(storage.getItem('kindis-test-key')).toBe('значение')
  })

  it('удаляет ключ', () => {
    storage.setItem('kindis-test-key', 'значение')
    storage.removeItem('kindis-test-key')

    expect(storage.getItem('kindis-test-key')).toBeNull()
  })

  it('неизвестный ключ даёт null, а не undefined', () => {
    expect(storage.getItem('kindis-absent')).toBeNull()
  })
})