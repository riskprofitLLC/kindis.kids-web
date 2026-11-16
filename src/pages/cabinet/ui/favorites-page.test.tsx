// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({ list: vi.fn() }))

vi.mock('@/shared/api/favorites-api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/shared/api/favorites-api')>()
  return { ...actual, favoritesApi: { ...actual.favoritesApi, list: mocks.list } }
})

import FavoritesPage from '@/pages/cabinet/ui/favorites-page'

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
        <FavoritesPage />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('FavoritesPage', () => {
  it('во время загрузки рисует скелетоны', () => {
    mocks.list.mockReturnValue(new Promise(() => {}))

    renderPage()

    expect(screen.queryByText('В избранном пока пусто')).toBeNull()
  })

  it('при ошибке показывает предупреждение', async () => {
    mocks.list.mockRejectedValue(new Error('сеть'))

    renderPage()

    await waitFor(() => expect(screen.getByRole('alert')).toBeTruthy())
    expect(screen.getByText('Проверьте соединение и попробуйте снова.')).toBeTruthy()
  })

  it('пустое избранное — состояние со ссылкой в каталог', async () => {
    mocks.list.mockResolvedValue([])

    renderPage()

    await waitFor(() => expect(screen.getByText('В избранном пока пусто')).toBeTruthy())
    expect(screen.getByRole('link', { name: 'Открыть каталог' })).toBeTruthy()
  })

  it('показывает товары избранного со ссылками и ценами', async () => {
    mocks.list.mockResolvedValue([
      { id: 'p-1', title: 'Серьги «Лаванда»', priceKopecks: 65_000 },
      { id: 'p-2', title: 'Брошь «Кот»', priceKopecks: 12_000 },
    ])

    renderPage()

    await waitFor(() => expect(screen.getByRole('link', { name: 'Серьги «Лаванда»' })).toBeTruthy())
    expect(screen.getByRole('link', { name: 'Брошь «Кот»' }).getAttribute('href')).toBe('/product/p-2')
    expect(screen.getByText('650 ₽')).toBeTruthy()
    expect(screen.getByText('120 ₽')).toBeTruthy()
  })
})