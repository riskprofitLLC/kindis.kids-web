// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  orders: vi.fn(),
  updateOrderStatus: vi.fn(),
  cancelOrder: vi.fn(),
}))

vi.mock('@/shared/api/seller-api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/shared/api/seller-api')>()
  return {
    ...actual,
    sellerApi: {
      ...actual.sellerApi,
      orders: mocks.orders,
      updateOrderStatus: mocks.updateOrderStatus,
      cancelOrder: mocks.cancelOrder,
    },
  }
})

import SellerOrdersPage from '@/pages/cabinet/ui/seller-orders-page'

let client: QueryClient

const order = {
  id: 'o-1',
  status: 'created',
  totalKopecks: 65_000,
  createdAt: '2026-11-01T10:00:00Z',
}

beforeEach(() => {
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  vi.clearAllMocks()
})

afterEach(cleanup)

function renderPage() {
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <SellerOrdersPage />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('SellerOrdersPage', () => {
  it('во время загрузки показывает скелетон', () => {
    mocks.orders.mockReturnValue(new Promise(() => {}))

    renderPage()

    expect(screen.queryByRole('combobox')).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Подтверждён' })).toBeNull()
  })

  it('без заказов пишет подсказку', async () => {
    mocks.orders.mockResolvedValue({ items: [], nextCursor: null, total: 0 })

    renderPage()

    await waitFor(() =>
      expect(screen.getByText('Заказов с таким статусом пока нет.')).toBeTruthy(),
    )
  })

  it('показывает заказ и переход в подтверждённый', async () => {
    const user = userEvent.setup()
    mocks.orders.mockResolvedValue({ items: [order], nextCursor: null, total: 1 })
    mocks.updateOrderStatus.mockResolvedValue({ ...order, status: 'confirmed' })

    renderPage()

    await waitFor(() => expect(screen.getByText('650 ₽')).toBeTruthy())

    await user.click(screen.getByRole('button', { name: 'Подтверждён' }))

    await waitFor(() =>
      expect(mocks.updateOrderStatus).toHaveBeenCalledWith('o-1', 'confirmed', undefined),
    )
  })

  it('для отправленного просит трек-номер и передаёт его', async () => {
    const user = userEvent.setup()
    mocks.orders.mockResolvedValue({
      items: [{ ...order, status: 'assembling' }],
      nextCursor: null,
      total: 1,
    })
    mocks.updateOrderStatus.mockResolvedValue(order)

    renderPage()

    await waitFor(() => expect(screen.getByLabelText(/Трек-номер/)).toBeTruthy())
    await user.type(screen.getByLabelText(/Трек-номер/), 'RR123')
    await user.click(screen.getByRole('button', { name: 'Отправлен' }))

    await waitFor(() =>
      expect(mocks.updateOrderStatus).toHaveBeenCalledWith('o-1', 'shipped', 'RR123'),
    )
  })

  it('отмена продавцом уходит в cancelOrder с причиной', async () => {
    const user = userEvent.setup()
    mocks.orders.mockResolvedValue({ items: [order], nextCursor: null, total: 1 })
    mocks.cancelOrder.mockResolvedValue({ ...order, status: 'cancelled' })

    renderPage()

    await waitFor(() => expect(screen.getByRole('button', { name: 'Отменён' })).toBeTruthy())
    await user.click(screen.getByRole('button', { name: 'Отменён' }))

    await waitFor(() =>
      expect(mocks.cancelOrder).toHaveBeenCalledWith('o-1', 'Отменён продавцом'),
    )
  })

  it('фильтр по статусу уходит в запрос списка', async () => {
    const user = userEvent.setup()
    mocks.orders.mockResolvedValue({ items: [], nextCursor: null, total: 0 })

    renderPage()

    await waitFor(() => expect(mocks.orders).toHaveBeenCalled())
    await user.selectOptions(screen.getByRole('combobox'), 'shipped')

    await waitFor(() =>
      expect(mocks.orders).toHaveBeenCalledWith({ status: 'shipped' }),
    )
  })
})
