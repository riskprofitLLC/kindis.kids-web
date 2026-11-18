// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useCheckout } from '@/features/checkout/model/use-checkout'
import type { Cart } from '@/shared/api/cart-api'

const checkout = vi.fn()

vi.mock('@/shared/api/orders-api', () => ({
  ordersApi: {
    checkout: (...args: unknown[]) => checkout(...args),
    mine: vi.fn(),
    byId: vi.fn(),
    cancel: vi.fn(),
  },
}))

let client: QueryClient

function wrapper({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}

const input = {
  deliveryMethod: 'post' as const,
  address: {
    label: 'Дом',
    city: 'Москва',
    street: 'Тверская',
    house: '1',
    apartment: '10',
    zip: '125009',
  },
}

beforeEach(() => {
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  vi.clearAllMocks()
})

describe('useCheckout', () => {
  it('оформляет заказ с ключом идемпотентности', async () => {
    checkout.mockResolvedValueOnce({ id: 'o-1' })

    const { result } = renderHook(() => useCheckout(), { wrapper })

    await act(async () => {
      await result.current.mutateAsync(input)
    })

    expect(checkout).toHaveBeenCalledTimes(1)
    const [, key] = checkout.mock.calls[0]
    expect(key).toBeTruthy()
  })

  it('повтор после сетевой ошибки с теми же данными переиспускает тот же ключ', async () => {
    checkout.mockRejectedValueOnce(new Error('network down'))
    checkout.mockResolvedValueOnce({ id: 'o-1' })

    const { result } = renderHook(() => useCheckout(), { wrapper })

    await act(async () => {
      await result.current.mutateAsync(input).catch(() => undefined)
      await result.current.mutateAsync(input)
    })

    expect(checkout).toHaveBeenCalledTimes(2)
    expect(checkout.mock.calls[1][1]).toBe(checkout.mock.calls[0][1])
  })

  it('вторая попытка после успеха получает новый ключ', async () => {
    checkout.mockResolvedValue({ id: 'o-1' })

    const { result } = renderHook(() => useCheckout(), { wrapper })

    await act(async () => {
      await result.current.mutateAsync(input)
      await result.current.mutateAsync(input)
    })

    expect(checkout).toHaveBeenCalledTimes(2)
    expect(checkout.mock.calls[1][1]).not.toBe(checkout.mock.calls[0][1])
  })

  it('смена способа доставки даёт новый ключ', async () => {
    checkout.mockResolvedValue({ id: 'o-1' })

    const { result } = renderHook(() => useCheckout(), { wrapper })

    await act(async () => {
      await result.current.mutateAsync(input).catch(() => undefined)
      await result.current.mutateAsync({ ...input, deliveryMethod: 'pickup' }).catch(() => undefined)
    })

    expect(checkout.mock.calls[1][1]).not.toBe(checkout.mock.calls[0][1])
  })

  it('смена адреса или комментария даёт новый ключ', async () => {
    checkout.mockResolvedValue({ id: 'o-1' })

    const { result } = renderHook(() => useCheckout(), { wrapper })

    await act(async () => {
      await result.current.mutateAsync(input).catch(() => undefined)
      await result.current.mutateAsync({ ...input, comment: 'Позвонить' }).catch(() => undefined)
      await result.current
        .mutateAsync({ ...input, address: { ...input.address, house: '2' }, comment: undefined })
        .catch(() => undefined)
    })

    expect(checkout.mock.calls[1][1]).not.toBe(checkout.mock.calls[0][1])
    expect(checkout.mock.calls[2][1]).not.toBe(checkout.mock.calls[0][1])
  })

  it('изменение состава корзины даёт новый ключ', async () => {
    checkout.mockResolvedValue({ id: 'o-1' })
    const item = {
      id: 'i-1',
      productId: 'p-1',
      quantity: 1,
      product: { id: 'p-1', title: 'Поделка', priceKopecks: 1000, stock: 5, status: 'active' },
    }
    const cart = (items: Cart['items']): Cart => ({ id: 'cart-1', items })

    const { result } = renderHook(() => useCheckout(), { wrapper })

    await act(async () => {
      client.setQueryData(['cart'], cart([]))
      await result.current.mutateAsync(input).catch(() => undefined)
      // Пока заказ не создан，в корзину добавился товар — старая попытка неактуальна.
      client.setQueryData(['cart'], cart([item]))
      await result.current.mutateAsync(input).catch(() => undefined)
    })

    expect(checkout.mock.calls[1][1]).not.toBe(checkout.mock.calls[0][1])
  })

  it('после успеха инвалидирует корзину', async () => {
    checkout.mockResolvedValueOnce({ id: 'o-1' })
    const invalidate = vi.spyOn(client, 'invalidateQueries')

    const { result } = renderHook(() => useCheckout(), { wrapper })

    await act(async () => {
      await result.current.mutateAsync(input)
    })

    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['cart'] })
  })
})
