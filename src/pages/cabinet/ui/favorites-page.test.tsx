// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { ProductCard as ProductCardModel } from '@/shared/api/catalog-api'

const mocks = vi.hoisted(() => ({ list: vi.fn() }))

vi.mock('@/shared/api/favorites-api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/shared/api/favorites-api')>()
  return { ...actual, favoritesApi: { ...actual.favoritesApi, list: mocks.list } }
})

vi.mock('@/features/media/model/use-media-url', () => ({
  useMediaUrl: () => null,
  renewMediaUrl: () => undefined,
}))

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

function product(overrides: Partial<ProductCardModel> = {}): ProductCardModel {
  return {
    id: 'p-1',
    title: 'Серьги «Лаванда»',
    description: null,
    priceKopecks: 65_000,
    stock: 3,
    createdAt: '2026-11-14T18:59:53.653Z',
    category: null,
    childProfile: null,
    media: [],
    ...overrides,
  }
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

  it('показывает товары избранного общей карточкой каталога', async () => {
    mocks.list.mockResolvedValue([
      product({
        id: 'p-1',
        title: 'Серьги «Лаванда»',
        priceKopecks: 65_000,
        media: [{ id: 'm-1', kind: 'photo' }],
        childProfile: {
          id: 'cp-1',
          slug: 'kolya-ivanov',
          name: 'Коля Иванов',
          age: 11,
          city: 'Сочи',
          hasDisability: false,
        },
      }),
      product({ id: 'p-2', title: 'Брошь «Кот»', priceKopecks: 12_000, stock: 0 }),
    ])

    renderPage()

    // Общая карточка каталога — заголовок ссылкой на товар.
    await waitFor(() =>
      expect(screen.getByRole('link', { name: /Серьги/ }).getAttribute('href')).toBe('/product/p-1'),
    )
    expect(screen.getByRole('link', { name: /Брошь/ }).getAttribute('href')).toBe('/product/p-2')
    expect(screen.getByText(/650/)).toBeTruthy()
    expect(screen.getByText(/120/)).toBeTruthy()
  })

  it('рисует фото и сердечко избранного внутри карточки', async () => {
    mocks.list.mockResolvedValue([
      product({ id: 'p-1', media: [{ id: 'm-1', kind: 'photo' }] }),
    ])

    renderPage()

    await waitFor(() =>
      expect(screen.getByRole('button', { name: /избранного/i })).toBeTruthy(),
    )
  })
})