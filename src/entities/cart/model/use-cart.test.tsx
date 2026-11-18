// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useAddToCart, useCart, useUpdateCartItem } from '@/entities/cart/model/use-cart'
import type { Cart } from '@/shared/api/cart-api'

const get = vi.fn()
const addItem = vi.fn()
const updateQuantity = vi.fn()

vi.mock('@/shared/api/cart-api', () => ({
  cartApi: {
    get: (...args: unknown[]) => get(...args),
    addItem: (...args: unknown[]) => addItem(...args),
    updateQuantity: (...args: unknown[]) => updateQuantity(...args),
  },
}))

function item(id: string, quantity: number) {
  return {
    id,
    productId: `p-${id}`,
    quantity,
    product: { id: `p-${id}`, title: 'Поделка', priceKopecks: 10_000, stock: 5, status: 'active' },
  }
}

function cart(items: ReturnType<typeof item>[]): Cart {
  return { id: 'cart-1', items }
}

let client: QueryClient

function wrapper({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}

beforeEach(() => {
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  vi.clearAllMocks()
})

describe('useCart', () => {
  it('читает корзину с сервера', async () => {
    get.mockResolvedValueOnce(cart([item('i-1', 2)]))

    const { result } = renderHook(() => useCart(), { wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.items[0].quantity).toBe(2)
  })

  it('пустая корзина (null) не ломает хук', async () => {
    get.mockResolvedValueOnce(null)

    const { result } = renderHook(() => useCart(), { wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toBeNull()
  })
})

describe('useAddToCart', () => {
  it('добавляет товар и инвалидирует кеш корзины', async () => {
    addItem.mockResolvedValueOnce(item('i-2', 1))
    const invalidate = vi.spyOn(client, 'invalidateQueries')

    const { result } = renderHook(() => useAddToCart(), { wrapper })

    await act(async () => {
      await result.current.mutateAsync({ productId: 'p-2' })
    })

    expect(addItem).toHaveBeenCalledWith('p-2', undefined)
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['cart'] })
  })
})

describe('useUpdateCartItem — оптимистичное обновление', () => {
  it('сразу меняет количество в кеше до ответа сервера', async () => {
    client.setQueryData(['cart'], cart([item('i-1', 1), item('i-2', 3)]))
    let resolveUpdate: (value: unknown) => void = () => {}
    updateQuantity.mockReturnValue(
      new Promise((resolve) => {
        resolveUpdate = resolve
      }),
    )

    const { result } = renderHook(() => useUpdateCartItem(), { wrapper })

    act(() => {
      void result.current.mutate({ itemId: 'i-2', quantity: 5 })
    })

    // Ответа ещё нет, а кеш уже показывает новое количество.
    await waitFor(() => expect(client.getQueryData<Cart>(['cart'])?.items[1].quantity).toBe(5))

    await act(async () => {
      resolveUpdate(item('i-2', 5))
      await Promise.resolve()
    })
  })

  it('откатывает количество обратно при ошибке сервера', async () => {
    client.setQueryData(['cart'], cart([item('i-1', 1), item('i-2', 3)]))
    updateQuantity.mockRejectedValueOnce(new Error('Сервер отклонил'))

    const { result } = renderHook(() => useUpdateCartItem(), { wrapper })

    await act(async () => {
      await expect(result.current.mutateAsync({ itemId: 'i-2', quantity: 5 })).rejects.toThrow(
        'Сервер отклонил',
      )
    })

    const cached = client.getQueryData<Cart>(['cart'])
    expect(cached?.items[1].quantity).toBe(3)
  })
})
