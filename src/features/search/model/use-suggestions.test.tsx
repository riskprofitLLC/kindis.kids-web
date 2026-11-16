// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useSuggestions } from '@/features/search/model/use-suggestions'

const suggestions = vi.fn()

vi.mock('@/shared/api/catalog-api', () => ({
  catalogApi: {
    suggestions: (...args: unknown[]) => suggestions(...args),
    categories: vi.fn(),
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

describe('useSuggestions', () => {
  it('короткий запрос не уходит на сервер', async () => {
    const { result } = renderHook(() => useSuggestions('я'), { wrapper })

    await waitFor(() => expect(result.current.fetchStatus).toBe('idle'))
    expect(suggestions).not.toHaveBeenCalled()
  })

  it('запрос от двух символов обрезается и уходит на сервер', async () => {
    suggestions.mockResolvedValueOnce([
      { id: 'p-1', title: 'Шкатулка', priceKopecks: 45_000, sellerSlug: 's', sellerName: 'Коля' },
    ])

    const { result } = renderHook(() => useSuggestions('  шка  '), { wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(suggestions).toHaveBeenCalledWith('шка')
    expect(result.current.data).toHaveLength(1)
  })

  it('пустая строка не считается запросом', async () => {
    const { result } = renderHook(() => useSuggestions('   '), { wrapper })

    await waitFor(() => expect(result.current.fetchStatus).toBe('idle'))
    expect(suggestions).not.toHaveBeenCalled()
  })
})