// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  mineChildren: vi.fn(),
  dashboard: vi.fn(),
  myOrders: vi.fn(),
}))

vi.mock('@/shared/api/children-api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/shared/api/children-api')>()
  return { ...actual, childrenApi: { ...actual.childrenApi, mine: mocks.mineChildren } }
})

vi.mock('@/shared/api/seller-api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/shared/api/seller-api')>()
  return { ...actual, sellerApi: { ...actual.sellerApi, dashboard: mocks.dashboard } }
})

vi.mock('@/shared/api/orders-api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/shared/api/orders-api')>()
  return { ...actual, ordersApi: { ...actual.ordersApi, mine: mocks.myOrders } }
})

import DashboardPage from '@/pages/cabinet/ui/dashboard-page'

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
        <DashboardPage />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('DashboardPage', () => {
  it('до загрузки профилей показывает скелетон', () => {
    mocks.mineChildren.mockReturnValue(new Promise(() => {}))

    renderPage()

    expect(screen.queryByText('Кабинет')).toBeNull()
  })

  it('покупателю без профиля ребёнка — быстрые ссылки и пустая история заказов', async () => {
    mocks.mineChildren.mockResolvedValue([])
    mocks.myOrders.mockResolvedValue([])

    renderPage()

    await waitFor(() => expect(screen.getByText('Кабинет')).toBeTruthy())
    expect(screen.getByRole('link', { name: 'Мои заказы' })).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Избранное' })).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Настройки профиля' })).toBeTruthy()
    expect(screen.getByText('Заказов пока нет.')).toBeTruthy()
    expect(mocks.dashboard).not.toHaveBeenCalled()
  })

  it('покупателю показывает три последних заказа с суммой и статусом', async () => {
    mocks.mineChildren.mockResolvedValue([])
    mocks.myOrders.mockResolvedValue([
      { id: 'o-1', status: 'created', totalKopecks: 65_000, createdAt: '2026-11-01T10:00:00Z' },
      { id: 'o-2', status: 'cancelled', totalKopecks: 12_000, createdAt: '2026-11-02T10:00:00Z' },
      { id: 'o-3', status: 'delivered', totalKopecks: 9000, createdAt: '2026-11-03T10:00:00Z' },
      { id: 'o-4', status: 'shipped', totalKopecks: 7000, createdAt: '2026-11-04T10:00:00Z' },
    ])

    renderPage()

    await waitFor(() => expect(screen.getByText('650 ₽')).toBeTruthy())
    expect(screen.getByText('Оформлен')).toBeTruthy()
    expect(screen.getByText('Отменён')).toBeTruthy()
    // Четвёртый заказ не влезает в сводку из трёх позиций.
    expect(screen.queryByText('70 ₽')).toBeNull()
  })

  it('продавцу с профилем ребёнка — сводка витрины из /seller/dashboard', async () => {
    mocks.mineChildren.mockResolvedValue([{ id: 'cp-1' }])
    mocks.dashboard.mockResolvedValue({
      newOrders: 4,
      profileViews: 120,
      revenue30DaysKopecks: 250_000,
      lowStockProducts: [{ id: 'p-1', title: 'Серьги', stock: 1 }],
    })

    renderPage()

    await waitFor(() => expect(screen.getByText('Новые заказы')).toBeTruthy())
    expect(screen.getByText('4')).toBeTruthy()
    expect(screen.getByText('120')).toBeTruthy()
    expect(screen.getByText('2 500 ₽')).toBeTruthy()
    expect(screen.getByText(/остаток менее 3 шт./)).toBeTruthy()
  })
})