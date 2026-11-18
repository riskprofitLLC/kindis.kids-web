// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { useCatalog } from '@/features/catalog/model/use-catalog'

const search = vi.fn()

vi.mock('@/shared/api/catalog-api', () => ({
  catalogApi: {
    search: (...args: unknown[]) => search(...args),
    categories: vi.fn(),
  },
}))

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}

const params = { query: 'бусы', sort: 'newest' as const }

describe('useCatalog', () => {
  it('грузит первую страницу и отдаёт items', async () => {
    search.mockResolvedValueOnce({
      items: [{ id: 'p-1' }, { id: 'p-2' }],
      nextCursor: 'cursor-2',
      total: 2,
    })

    const { result } = renderHook(() => useCatalog(params), { wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(search).toHaveBeenCalledWith({ ...params, cursor: undefined })
    expect(result.current.data?.pages[0].items).toHaveLength(2)
  })

  it('getNextPageParam берёт курсор из ответа', async () => {
    search.mockResolvedValueOnce({
      items: [{ id: 'p-1' }],
      nextCursor: 'cursor-2',
      total: 1,
    })

    const { result } = renderHook(() => useCatalog(params), { wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.hasNextPage).toBe(true)
  })

  it('без nextCursor следующей страницы нет', async () => {
    search.mockResolvedValueOnce({ items: [{ id: 'p-1' }], nextCursor: null, total: 1 })

    const { result } = renderHook(() => useCatalog(params), { wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.hasNextPage).toBe(false)
  })

  it('ошибка сети пробрасывается в isError', async () => {
    search.mockRejectedValueOnce(new Error('Нет связи'))

    const { result } = renderHook(() => useCatalog(params), { wrapper })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error?.message).toBe('Нет связи')
  })
})
