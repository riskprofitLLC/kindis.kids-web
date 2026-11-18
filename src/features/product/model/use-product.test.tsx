// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useProduct, useSimilarProducts } from '@/features/product/model/use-product'

const product = vi.fn()
const similar = vi.fn()

vi.mock('@/shared/api/catalog-api', () => ({
  catalogApi: {
    product: (...args: unknown[]) => product(...args),
    similar: (...args: unknown[]) => similar(...args),
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

describe('useProduct', () => {
  it('грузит товар по id', async () => {
    product.mockResolvedValueOnce({ id: 'p-1', title: 'Шкатулка' })

    const { result } = renderHook(() => useProduct('p-1'), { wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(product).toHaveBeenCalledWith('p-1')
    expect(result.current.data?.title).toBe('Шкатулка')
  })

  it('без id запрос не уходит вовсе', async () => {
    const { result } = renderHook(() => useProduct(undefined), { wrapper })

    await waitFor(() => expect(result.current.fetchStatus).toBe('idle'))
    expect(product).not.toHaveBeenCalled()
    expect(result.current.data).toBeUndefined()
  })
})

describe('useSimilarProducts', () => {
  it('грузит похожие товары отдельным ключом кеша', async () => {
    similar.mockResolvedValueOnce([{ id: 'p-2' }, { id: 'p-3' }])

    const { result } = renderHook(() => useSimilarProducts('p-1'), { wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(similar).toHaveBeenCalledWith('p-1')
    // Кеш товара и кеш похожих не пересекаются.
    expect(client.getQueryData(['product-similar', 'p-1'])).toEqual([{ id: 'p-2' }, { id: 'p-3' }])
  })
})
