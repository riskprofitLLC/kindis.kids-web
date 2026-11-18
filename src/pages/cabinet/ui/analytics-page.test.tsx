// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({ stats: vi.fn() }))

vi.mock('@/shared/api/seller-api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/shared/api/seller-api')>()
  return { ...actual, sellerApi: { ...actual.sellerApi, stats: mocks.stats } }
})

import AnalyticsPage from '@/pages/cabinet/ui/analytics-page'

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
        <AnalyticsPage />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('AnalyticsPage', () => {
  it('во время загрузки показывает скелетон', () => {
    mocks.stats.mockReturnValue(new Promise(() => {}))

    renderPage()

    expect(screen.queryByText('Аналитика витрины')).toBeNull()
  })

  it('при ошибке показывает предупреждение', async () => {
    mocks.stats.mockRejectedValue(new Error('сеть'))

    renderPage()

    await waitFor(() => expect(screen.getByRole('alert')).toBeTruthy())
    expect(screen.getByText('Попробуйте обновить страницу позже.')).toBeTruthy()
  })

  it('рисует итоги и графики по дням', async () => {
    mocks.stats.mockResolvedValue({
      days: [
        { day: '2026-11-01', views: 10, salesKopecks: 65_000, ordersCount: 1 },
        { day: '2026-11-02', views: 5, salesKopecks: 12_000, ordersCount: 1 },
      ],
      totals: { views: 15, salesKopecks: 77_000, ordersCount: 2 },
    })

    renderPage()

    await waitFor(() => expect(screen.getByText('Аналитика витрины')).toBeTruthy())
    expect(screen.getByText('15')).toBeTruthy()
    expect(screen.getByText('770 ₽')).toBeTruthy()
    expect(screen.getByText('2')).toBeTruthy()
    expect(screen.getByRole('img', { name: 'График просмотров по дням' })).toBeTruthy()
    expect(screen.getByRole('img', { name: 'График продаж по дням' })).toBeTruthy()
    expect(screen.getByTitle('2026-11-01: 10')).toBeTruthy()
  })

  it('без данных за период пишет заглушки под графиками', async () => {
    mocks.stats.mockResolvedValue({
      days: [],
      totals: { views: 0, salesKopecks: 0, ordersCount: 0 },
    })

    renderPage()

    await waitFor(() => expect(screen.getAllByText('Данных за период пока нет.')).toHaveLength(2))
    expect(screen.queryByRole('img', { name: 'График просмотров по дням' })).toBeNull()
  })
})
