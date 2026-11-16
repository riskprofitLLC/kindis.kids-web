// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useCancelOrder, useMyOrders, useOrder } from '@/features/orders/model/use-orders'

const mine = vi.fn()
const byId = vi.fn()
const cancel = vi.fn()

vi.mock('@/shared/api/orders-api', () => ({
  ordersApi: {
    mine: (...args: unknown[]) => mine(...args),
    byId: (...args: unknown[]) => byId(...args),
    cancel: (...args: unknown[]) => cancel(...args),
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

describe('useMyOrders', () => {
  it('грузит список заказов покупателя', async () => {
    mine.mockResolvedValueOnce([{ id: 'o-1', status: 'paid' }])

    const { result } = renderHook(() => useMyOrders(), { wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.[0].id).toBe('o-1')
  })
})

describe('useOrder', () => {
  it('грузит заказ по id и молчит без id', async () => {
    byId.mockResolvedValueOnce({ id: 'o-1', status: 'paid' })

    const { result } = renderHook(() => useOrder('o-1'), { wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(byId).toHaveBeenCalledWith('o-1')

    const idle = renderHook(() => useOrder(undefined), { wrapper })
    await waitFor(() => expect(idle.result.current.fetchStatus).toBe('idle'))
  })
})

describe('useCancelOrder', () => {
  it('отменяет заказ и инвалидирует оба кеша', async () => {
    cancel.mockResolvedValueOnce(undefined)
    const invalidate = vi.spyOn(client, 'invalidateQueries')

    const { result } = renderHook(() => useCancelOrder(), { wrapper })

    await act(async () => {
      await result.current.mutateAsync({ id: 'o-1', reason: 'передумал' })
    })

    expect(cancel).toHaveBeenCalledWith('o-1', 'передумал')
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['my-orders'] })
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['order'] })
  })

  it('ошибка отмены не трогает кеш и всплывает наружу', async () => {
    cancel.mockRejectedValueOnce(new Error('Статус не позволяет'))

    const { result } = renderHook(() => useCancelOrder(), { wrapper })

    await act(async () => {
      await expect(
        result.current.mutateAsync({ id: 'o-1' }),
      ).rejects.toThrow('Статус не позволяет')
    })
  })
})