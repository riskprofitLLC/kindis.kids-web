// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({ byId: vi.fn(), cancel: vi.fn() }))

vi.mock('@/shared/api/orders-api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/shared/api/orders-api')>()
  return {
    ...actual,
    ordersApi: { ...actual.ordersApi, byId: mocks.byId, cancel: mocks.cancel },
  }
})

import OrderDetailPage from '@/pages/cabinet/ui/order-detail-page'

let client: QueryClient

beforeEach(() => {
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  vi.clearAllMocks()
})

afterEach(cleanup)

function renderPage(orderId = 'o-1') {
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[`/cabinet/orders/${orderId}`]}>
        <Routes>
          <Route path="/cabinet/orders/:orderId" element={<OrderDetailPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

const order = {
  id: 'o-1',
  status: 'created',
  totalKopecks: 65_000,
  createdAt: '2026-11-01T10:00:00Z',
  items: [{ id: 'i-1', titleSnapshot: 'Серьги «Лаванда»', quantity: 2, priceKopecks: 32_500 }],
}

describe('OrderDetailPage', () => {
  it('во время загрузки показывает скелетон', () => {
    mocks.byId.mockReturnValue(new Promise(() => {}))

    renderPage()

    expect(screen.queryByText('Итого:', { exact: false })).toBeNull()
  })

  it('если заказ не найден — предупреждение со ссылкой в список', async () => {
    mocks.byId.mockRejectedValue(new Error('404'))

    renderPage()

    await waitFor(() => expect(screen.getByRole('alert')).toBeTruthy())
    expect(screen.getByText(/Вернитесь в/)).toBeTruthy()
    expect(screen.getByRole('link', { name: 'список заказов' })).toBeTruthy()
  })

  it('рисует состав заказа и итог', async () => {
    mocks.byId.mockResolvedValue(order)

    renderPage()

    await waitFor(() => expect(screen.getByText(/Серьги «Лаванда»/)).toBeTruthy())
    expect(screen.getByText(/× 2/)).toBeTruthy()
    expect(screen.getByText('Итого: 650 ₽')).toBeTruthy()
    expect(mocks.byId).toHaveBeenCalledWith('o-1')
  })

  it('в статуе «оформлен» позволяет отменить с причиной', async () => {
    const user = userEvent.setup()
    mocks.byId.mockResolvedValue(order)
    mocks.cancel.mockResolvedValue({ ...order, status: 'cancelled' })

    renderPage()

    await waitFor(() => expect(screen.getByRole('button', { name: 'Отменить заказ' })).toBeTruthy())

    await user.type(screen.getByLabelText('Причина отмены'), 'передумал')
    await user.click(screen.getByRole('button', { name: 'Отменить заказ' }))

    await waitFor(() => expect(mocks.cancel).toHaveBeenCalledWith('o-1', 'передумал'))
  })

  it('пустая причина отмены уходит как undefined', async () => {
    const user = userEvent.setup()
    mocks.byId.mockResolvedValue(order)
    mocks.cancel.mockResolvedValue({ ...order, status: 'cancelled' })

    renderPage()

    await waitFor(() => expect(screen.getByRole('button', { name: 'Отменить заказ' })).toBeTruthy())
    await user.click(screen.getByRole('button', { name: 'Отменить заказ' }))

    await waitFor(() => expect(mocks.cancel).toHaveBeenCalledWith('o-1', undefined))
  })

  it('ошибку отмены показывает алертом с текстом ApiError', async () => {
    const user = userEvent.setup()
    const { ApiError } = await import('@/shared/api/errors')
    mocks.byId.mockResolvedValue(order)
    mocks.cancel.mockRejectedValue(new ApiError('Статус уже изменён', 409))

    renderPage()

    await waitFor(() => expect(screen.getByRole('button', { name: 'Отменить заказ' })).toBeTruthy())
    await user.click(screen.getByRole('button', { name: 'Отменить заказ' }))

    await waitFor(() => expect(screen.getByRole('alert')).toBeTruthy())
    expect(screen.getByText('Статус уже изменён')).toBeTruthy()
  })

  it('в доставленном статусе кнопки отмены нет', async () => {
    mocks.byId.mockResolvedValue({ ...order, status: 'delivered' })

    renderPage()

    await waitFor(() => expect(screen.getByText(/Доставлен/)).toBeTruthy())
    expect(screen.queryByRole('button', { name: 'Отменить заказ' })).toBeNull()
  })
})
