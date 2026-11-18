// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({ getReadUrl: vi.fn() }))

vi.mock('@/shared/api/media-api', () => ({
  mediaApi: { getReadUrl: mocks.getReadUrl },
}))

import { renewMediaUrl, useMediaUrl } from '@/features/media/model/use-media-url'

const TTL_MS = 5 * 60 * 1000

beforeEach(() => {
  vi.useFakeTimers()
  mocks.getReadUrl.mockReset()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('useMediaUrl', () => {
  it('отдаёт закешированную ссылку без повторного запроса', async () => {
    mocks.getReadUrl.mockResolvedValue('https://storage/first')

    const { result, rerender } = renderHook(() => useMediaUrl('m-cache'))
    await act(async () => {})

    expect(result.current).toBe('https://storage/first')

    rerender()
    await act(async () => {})

    expect(mocks.getReadUrl).toHaveBeenCalledTimes(1)
  })

  it('по истечении TTL ссылка запрашивается заново', async () => {
    mocks.getReadUrl.mockResolvedValue('https://storage/stale')

    const { result } = renderHook(() => useMediaUrl('m-ttl'))
    await act(async () => {})
    expect(result.current).toBe('https://storage/stale')

    mocks.getReadUrl.mockResolvedValue('https://storage/fresh')
    await act(async () => {
      vi.advanceTimersByTime(TTL_MS + 1000)
    })

    expect(mocks.getReadUrl).toHaveBeenCalledTimes(2)
    expect(result.current).toBe('https://storage/fresh')
  })
})

describe('renewMediaUrl', () => {
  it('ошибка загрузки один раз обновляет ссылку', async () => {
    mocks.getReadUrl.mockResolvedValue('https://storage/broken')

    const { result } = renderHook(() => useMediaUrl('m-renew'))
    await act(async () => {})
    expect(result.current).toBe('https://storage/broken')

    mocks.getReadUrl.mockResolvedValue('https://storage/renewed')
    await act(async () => {
      await renewMediaUrl('m-renew')
      // Вторая попытка не долбит хранилище — на ссылку одно обновление.
      await renewMediaUrl('m-renew')
    })

    expect(mocks.getReadUrl).toHaveBeenCalledTimes(2)
    expect(result.current).toBe('https://storage/renewed')
  })

  it('без медиа не запрашивает ссылку', async () => {
    await act(async () => {
      await renewMediaUrl(null)
      await renewMediaUrl(undefined)
    })

    expect(mocks.getReadUrl).not.toHaveBeenCalled()
  })
})
