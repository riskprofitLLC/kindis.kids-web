// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useFavorites, useToggleFavorite } from '@/features/favorites/model/use-favorites'

const list = vi.fn()
const add = vi.fn()
const remove = vi.fn()

vi.mock('@/shared/api/favorites-api', () => ({
  favoritesApi: {
    list: (...args: unknown[]) => list(...args),
    add: (...args: unknown[]) => add(...args),
    remove: (...args: unknown[]) => remove(...args),
  },
}))

let client: QueryClient

function wrapper({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}

beforeEach(() => {
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  vi.clearAllMocks()
})

describe('useFavorites', () => {
  it('читает список избранного', async () => {
    list.mockResolvedValueOnce([{ id: 'p-1' }, { id: 'p-2' }])

    const { result } = renderHook(() => useFavorites(), { wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toHaveLength(2)
  })

  it('ошибка сети видна в isError', async () => {
    list.mockRejectedValueOnce(new Error('Нет связи'))

    const { result } = renderHook(() => useFavorites(), { wrapper })

    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})

describe('useToggleFavorite', () => {
  it('добавляет товар, которого ещё нет в избранном', async () => {
    add.mockResolvedValueOnce(undefined)
    const invalidate = vi.spyOn(client, 'invalidateQueries')

    const { result } = renderHook(() => useToggleFavorite(), { wrapper })

    await act(async () => {
      await result.current.mutateAsync({ productId: 'p-1', inFavorite: false })
    })

    expect(add).toHaveBeenCalledWith('p-1')
    expect(remove).not.toHaveBeenCalled()
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['favorites'] })
  })

  it('убирает товар, который уже в избранном', async () => {
    remove.mockResolvedValueOnce(undefined)

    const { result } = renderHook(() => useToggleFavorite(), { wrapper })

    await act(async () => {
      await result.current.mutateAsync({ productId: 'p-1', inFavorite: true })
    })

    expect(remove).toHaveBeenCalledWith('p-1')
    expect(add).not.toHaveBeenCalled()
  })
})
