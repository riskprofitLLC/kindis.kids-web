// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const state = vi.hoisted(() => ({
  items: [] as unknown[],
  mutate: vi.fn(),
}))

vi.mock('@/entities/session/model/session-store', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/entities/session/model/session-store')>()
  return {
    ...actual,
    useSessionStore: (selector: (value: unknown) => unknown) =>
      selector({ user: { id: 'u-1' }, status: 'authenticated' }),
  }
})

vi.mock('@/features/reviews/model/use-reviewable-items', () => ({
  useReviewableItems: () => ({ data: state.items }),
}))

vi.mock('@/features/reviews/model/use-reviews', () => ({
  useProductReviews: () => ({
    reviews: { data: [], isPending: false },
    rating: { data: null },
    invalidate: vi.fn(),
  }),
  useCreateReview: () => ({ mutate: state.mutate, isPending: false }),
}))

import { ProductReviews } from '@/features/reviews/ui/product-reviews'

let client: QueryClient

function wrapper({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}

const purchase = (id: string) => ({
  id,
  productId: 'p-1',
  quantity: 1,
  priceKopecks: 100000,
  titleSnapshot: 'Бусы из бисера',
  orderId: `o-${id}`,
  orderDate: '2026-11-01T10:00:00.000Z',
})

beforeEach(() => {
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  vi.clearAllMocks()
})

afterEach(cleanup)

describe('ProductReviews', () => {
  it('одна покупка — выбора позиции нет，отзыв уходит по ней', async () => {
    const user = userEvent.setup()
    state.items = [purchase('oi-1')]

    render(<ProductReviews productId="p-1" />, { wrapper })

    expect(screen.queryByLabelText('По какой покупке')).toBeNull()

    await user.click(screen.getByRole('button', { name: 'Опубликовать отзыв' }))

    await waitFor(() =>
      expect(state.mutate).toHaveBeenCalledWith(
        { orderItemId: 'oi-1', rating: 5, text: '' },
        expect.anything(),
      ),
    )
  })

  it('несколько покупок — позицию можно выбрать，отзыв уходит по выбранной', async () => {
    const user = userEvent.setup()
    state.items = [purchase('oi-1'), purchase('oi-2')]

    render(<ProductReviews productId="p-1" />, { wrapper })

    const select = screen.getByLabelText('По какой покупке')
    expect(select.querySelectorAll('option')).toHaveLength(2)

    await user.selectOptions(select, 'oi-2')
    await user.click(screen.getByRole('button', { name: 'Опубликовать отзыв' }))

    await waitFor(() =>
      expect(state.mutate).toHaveBeenCalledWith(
        { orderItemId: 'oi-2', rating: 5, text: '' },
        expect.anything(),
      ),
    )
  })
})