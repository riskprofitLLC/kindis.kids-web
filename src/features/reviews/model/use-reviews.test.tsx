// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useCreateReview, useProductReviews, useSellerReviews } from '@/features/reviews/model/use-reviews'

const forProduct = vi.fn()
const productRating = vi.fn()
const forSeller = vi.fn()
const create = vi.fn()

vi.mock('@/shared/api/reviews-api', () => ({
  reviewsApi: {
    forProduct: (...args: unknown[]) => forProduct(...args),
    productRating: (...args: unknown[]) => productRating(...args),
    forSeller: (...args: unknown[]) => forSeller(...args),
    create: (...args: unknown[]) => create(...args),
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

describe('useProductReviews', () => {
  it('грузит отзывы и рейтинг двумя независимыми запросами', async () => {
    forProduct.mockResolvedValueOnce([{ id: 'r-1', rating: 5, text: 'Отлично' }])
    productRating.mockResolvedValueOnce({ average: 4.8, count: 12 })

    const { result } = renderHook(() => useProductReviews('p-1'), { wrapper })

    await waitFor(() => {
      expect(result.current.reviews.isSuccess).toBe(true)
      expect(result.current.rating.isSuccess).toBe(true)
    })

    expect(forProduct).toHaveBeenCalledWith('p-1')
    expect(productRating).toHaveBeenCalledWith('p-1')
    expect(result.current.rating.data?.average).toBe(4.8)
  })

  it('без товара запросы не уходят', async () => {
    const { result } = renderHook(() => useProductReviews(undefined), { wrapper })

    await waitFor(() => expect(result.current.reviews.fetchStatus).toBe('idle'))
    expect(forProduct).not.toHaveBeenCalled()
  })

  it('invalidate сбрасывает оба кеша товара', async () => {
    const invalidate = vi.spyOn(client, 'invalidateQueries')
    const { result } = renderHook(() => useProductReviews('p-1'), { wrapper })

    act(() => result.current.invalidate())

    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['product-reviews', 'p-1'] })
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['product-rating', 'p-1'] })
  })
})

describe('useSellerReviews', () => {
  it('грузит отзывы витрины по слагу', async () => {
    forSeller.mockResolvedValueOnce([{ id: 'r-9' }])

    const { result } = renderHook(() => useSellerReviews('kolya-ivanov'), { wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(forSeller).toHaveBeenCalledWith('kolya-ivanov')
  })
})

describe('useCreateReview', () => {
  it('после успеха вызывает колбэк завершения', async () => {
    create.mockResolvedValueOnce({ id: 'r-2' })
    const onDone = vi.fn()

    const { result } = renderHook(() => useCreateReview(onDone), { wrapper })

    await act(async () => {
      await result.current.mutateAsync({ orderItemId: 'oi-1', rating: 5, text: 'Супер' })
    })

    expect(create).toHaveBeenCalledWith('oi-1', { rating: 5, text: 'Супер' })
    expect(onDone).toHaveBeenCalledTimes(1)
  })

  it('ошибка создания не вызывает колбэк', async () => {
    create.mockRejectedValueOnce(new Error('Позиция не завершена'))
    const onDone = vi.fn()

    const { result } = renderHook(() => useCreateReview(onDone), { wrapper })

    await act(async () => {
      await expect(
        result.current.mutateAsync({ orderItemId: 'oi-1', rating: 5 }),
      ).rejects.toThrow('Позиция не завершена')
    })

    expect(onDone).not.toHaveBeenCalled()
  })
})