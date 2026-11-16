// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({ mine: vi.fn() }))

vi.mock('@/shared/api/orders-api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/shared/api/orders-api')>()
  return { ...actual, ordersApi: { ...actual.ordersApi, mine: mocks.mine } }
})

import OrdersPage from '@/pages/cabinet/ui/orders-page'

let client: QueryClient

beforeEach(() => {
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  vi.clearAllMocks()
})

afterEach(cleanup)

function renderPage() {
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <OrdersPage />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('OrdersPage', () => {
  it('во время загрузки рисует скелетоны списка', () => {
    mocks.mine.mockReturnValue(new Promise(() => {}))

    renderPage()

    expect(screen.queryByText('Заказов пока нет')).toBeNull()
  })

  it('при ошибке показывает предупреждение', async () => {
    mocks.mine.mockRejectedValue(new Error('сеть'))

    renderPage()

    await waitFor(() => expect(screen.getByRole('alert')).toBeTruthy())
    expect(screen.getByText('Проверьте соединение и попробуйте снова.')).toBeTruthy()
  })

  it('без заказов — пустое состояние со ссылкой в каталог', async () => {
    mocks.mine.mockResolvedValue([])

    renderPage()

    await waitFor(() => expect(screen.getByText('Заказов пока нет')).toBeTruthy())
    expect(screen.getByRole('link', { name: 'Открыть каталог' })).toBeTruthy()
  })

  it('показывает заказы с датой, суммой и ссылкой на детали', async () => {
    mocks.mine.mockResolvedValue([
      { id: 'o-1', status: 'created', totalKopecks: 65_000, createdAt: '2026-11-01T10:00:00Z' },
      { id: 'o-2', status: 'cancelled', totalKopecks: 12_000, createdAt: '2026-11-02T10:00:00Z' },
    ])

    renderPage()

    await waitFor(() => expect(screen.getByText('650 ₽')).toBeTruthy())
    expect(screen.getByText('Оформлен')).toBeTruthy()
    expect(screen.getByText('Отменён')).toBeTruthy()
    const links = screen.getAllByRole('link', { name: 'Детали' })
    expect(links).toHaveLength(2)
    expect(links[0].getAttribute('href')).toBe('/cabinet/orders/o-1')
    expect(links[1].getAttribute('href')).toBe('/cabinet/orders/o-2')
  })
})