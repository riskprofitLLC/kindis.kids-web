// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  product: vi.fn(),
  similar: vi.fn(),
  forProduct: vi.fn(),
  productRating: vi.fn(),
  mine: vi.fn(),
  mediaUrl: vi.fn(),
}))

vi.mock('@/shared/api/catalog-api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/shared/api/catalog-api')>()
  return {
    ...actual,
    catalogApi: { ...actual.catalogApi, product: mocks.product, similar: mocks.similar },
  }
})

vi.mock('@/shared/api/reviews-api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/shared/api/reviews-api')>()
  return {
    ...actual,
    reviewsApi: {
      ...actual.reviewsApi,
      forProduct: mocks.forProduct,
      productRating: mocks.productRating,
    },
  }
})

vi.mock('@/shared/api/orders-api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/shared/api/orders-api')>()
  return { ...actual, ordersApi: { ...actual.ordersApi, mine: mocks.mine } }
})

// Карту и медиа в jsdom не поднимаем.
vi.mock('@/features/map/ui/product-location-map', () => ({
  default: ({ latitude, longitude }: { latitude: number; longitude: number }) => (
    <div data-testid="mini-map">{`${latitude}:${longitude}`}</div>
  ),
}))

vi.mock('@/features/media/model/use-media-url', () => ({
  useMediaUrl: (mediaId: string | null) => mocks.mediaUrl(mediaId),
  renewMediaUrl: () => undefined,
}))

import ProductPage from '@/pages/product/ui/product-page'
import { clearRecent, listRecent } from '@/shared/lib/recently-viewed'

let client: QueryClient

beforeEach(() => {
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  vi.clearAllMocks()
  mocks.mediaUrl.mockReset()
  mocks.mediaUrl.mockReturnValue(null)
  clearRecent()
})

afterEach(cleanup)

function renderPage() {
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={['/product/p-1']}>
        <Routes>
          <Route path="/product/:slug" element={<ProductPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

const detail = {
  id: 'p-1',
  title: 'Серьги «Лаванда»',
  description: 'Ручная работа',
  priceKopecks: 65000,
  stock: 3,
  createdAt: '2026-11-14T18:59:53.653Z',
  category: null,
  childProfile: {
    id: 'cp-1',
    slug: 'kolya-ivanov',
    name: 'Коля Иванов',
    age: 11,
    city: 'Сочи',
    hasDisability: false,
    about: null,
    avatarMediaId: null,
  },
  media: [],
  specs: [],
  rating: null,
  reviewsCount: 0,
}

describe('ProductPage', () => {
  it('показывает адрес,мини-карту и кнопку чата с продавцом', async () => {
    mocks.product.mockResolvedValue({
      ...detail,
      address: 'Сочи,ул. Ленина,10',
      latitude: 43.6,
      longitude: 39.7,
    })
    mocks.similar.mockResolvedValue([])
    mocks.forProduct.mockResolvedValue([])
    mocks.productRating.mockResolvedValue({ average: 0, count: 0 })

    renderPage()

    await waitFor(() =>
      expect(screen.getByRole('heading', { name: 'Серьги «Лаванда»' })).toBeTruthy(),
    )
    expect(screen.getByText('Сочи,ул. Ленина,10')).toBeTruthy()
    expect((await screen.findByTestId('mini-map')).textContent).toBe('43.6:39.7')
    expect(screen.getByRole('button', { name: 'Написать продавцу' })).toBeTruthy()
    // Форма отзыва гостю недоступна — у него нет заказов.
    expect(screen.queryByRole('button', { name: 'Опубликовать отзыв' })).toBeNull()
  })

  it('без координат блока места сделки нет', async () => {
    mocks.product.mockResolvedValue(detail)
    mocks.similar.mockResolvedValue([])
    mocks.forProduct.mockResolvedValue([])
    mocks.productRating.mockResolvedValue({ average: 0, count: 0 })

    renderPage()

    await waitFor(() =>
      expect(screen.getByRole('heading', { name: 'Серьги «Лаванда»' })).toBeTruthy(),
    )
    expect(screen.queryByText('Место сделки')).toBeNull()
    expect(screen.getByRole('button', { name: 'Написать продавцу' })).toBeTruthy()
  })
  it('выставляет мету страницы и пишет товар в недавно смотрели', async () => {
    mocks.product.mockResolvedValue(detail)
    mocks.similar.mockResolvedValue([])
    mocks.forProduct.mockResolvedValue([])
    mocks.productRating.mockResolvedValue({ average: 0, count: 0 })

    renderPage()

    await waitFor(() =>
      expect(screen.getByRole('heading', { name: 'Серьги «Лаванда»' })).toBeTruthy(),
    )

    expect(document.title).toBe('Серьги «Лаванда» — kindis.kids')
    const description = document.head.querySelector('meta[name="description"]')
    expect(description?.getAttribute('content')).toBe('Ручная работа')
    expect(listRecent()).toEqual([{ id: 'p-1', title: 'Серьги «Лаванда»' }])
    // Блок «Недавно смотрели» отрисован внизу страницы со ссылкой на этот товар.
    const recentNav = screen.getByRole('navigation', { name: 'Недавно смотрели' })
    expect(recentNav.textContent).toContain('Серьги «Лаванда»')
  })

  it('первое фото товара уходит в og-image', async () => {
    mocks.product.mockResolvedValue({
      ...detail,
      media: [
        { id: 'm-1', kind: 'photo' },
        { id: 'm-2', kind: 'video' },
      ],
    })
    mocks.mediaUrl.mockImplementation((mediaId) =>
      mediaId === 'm-1' ? 'https://cdn.test/lavanda.jpg' : null,
    )
    mocks.similar.mockResolvedValue([])
    mocks.forProduct.mockResolvedValue([])
    mocks.productRating.mockResolvedValue({ average: 0, count: 0 })

    renderPage()

    await waitFor(() =>
      expect(screen.getByRole('heading', { name: 'Серьги «Лаванда»' })).toBeTruthy(),
    )

    await waitFor(() => {
      const ogImage = Array.from(document.head.querySelectorAll('meta')).find(
        (meta) => meta.getAttribute('property') === 'og:image',
      )
      expect(ogImage?.getAttribute('content')).toBe('https://cdn.test/lavanda.jpg')
    })
  })
})
