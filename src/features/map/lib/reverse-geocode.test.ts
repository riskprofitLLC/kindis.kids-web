// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'

import { reverseGeocode } from '@/features/map/lib/reverse-geocode'

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('reverseGeocode', () => {
  it('возвращает адрес из ответа Nominatim', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ display_name: 'Сочи, улица Ленина, 10' }),
    })
    vi.stubGlobal('fetch', fetchMock)

    const address = await reverseGeocode(43.6, 39.7)

    expect(address).toBe('Сочи, улица Ленина, 10')
    expect(fetchMock).toHaveBeenCalledTimes(1)
    // В dev запрос идёт через прокси vite.
    expect(String(fetchMock.mock.calls[0][0])).toContain('/nominatim/reverse')
  })

  it('пустой ответ отдаёт null', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) }),
    )

    await expect(reverseGeocode(43.6, 39.7)).resolves.toBeNull()
  })

  it('ошибка сети отдаёт null — адрес вводят вручную', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')))

    await expect(reverseGeocode(43.6, 39.7)).resolves.toBeNull()
  })

  it('неуспешный статус отдаёт null', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: false, json: async () => ({}) }),
    )

    await expect(reverseGeocode(43.6, 39.7)).resolves.toBeNull()
  })
})