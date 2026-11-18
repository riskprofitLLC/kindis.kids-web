// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useCheckout } from '@/features/checkout/model/use-checkout'

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

  it('повторная попытка переиспользует тот же ключ — второй заказ не создастся', async () => {
    checkout.mockResolvedValue({ id: 'o-1' })

    const { result } = renderHook(() => useCheckout(), { wrapper })

    await act(async () => {
      await result.current.mutateAsync(input)
      await result.current.mutateAsync(input)
    })

    expect(checkout).toHaveBeenCalledTimes(2)
    const firstKey = checkout.mock.calls[0][1]
    const secondKey = checkout.mock.calls[1][1]
    expect(secondKey).toBe(firstKey)
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
