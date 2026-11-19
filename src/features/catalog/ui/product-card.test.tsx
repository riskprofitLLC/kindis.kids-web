// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ProductCard } from '@/features/catalog/ui/product-card'
import type { ProductCard as ProductCardModel } from '@/shared/api/catalog-api'

const mocks = vi.hoisted(() => ({ url: null as string | null, renew: vi.fn() }))

vi.mock('@/features/media/model/use-media-url', () => ({
  useMediaUrl: () => mocks.url,
  renewMediaUrl: mocks.renew,
}))

// Без globals RTL не чистит DOM сам — делаем это вручную между тестами.
afterEach(cleanup)

beforeEach(() => {
  mocks.url = null
  mocks.renew.mockClear()
})

function product(overrides: Partial<ProductCardModel> = {}): ProductCardModel {
  return {
    id: 'p-1',
    title: 'Серьги из полимерной глины «Лаванда»',
    description: 'Демо-карточка',
    priceKopecks: 65_000,
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
    },
    media: [],
    ...overrides,
  }
}

function renderCard(model: ProductCardModel) {
  const client = new QueryClient()
  return render(
    <MemoryRouter>
      <QueryClientProvider client={client}>
        <ProductCard product={model} />
      </QueryClientProvider>
    </MemoryRouter>,
  )
}

describe('ProductCard', () => {
  it('показывает цену в рублях', () => {
    renderCard(product())

    expect(screen.getByText(/650/)).toBeTruthy()
  })

  it('показывает город продавца', () => {
    renderCard(product())

    expect(screen.getByText('Сочи')).toBeTruthy()
  })

  it('ссылка ведёт на страницу товара', () => {
    renderCard(product())

    // В карточке две ссылки — фото и заголовок; обе ведут на товар.
    const links = screen.getAllByRole('link')
    expect(links.length).toBeGreaterThan(0)
    for (const link of links) {
      expect(link.getAttribute('href')).toContain('p-1')
    }
  })

  it('без фото показывает заглушку', () => {
    renderCard(product({ media: [] }))

    expect(screen.getByText('Фото нет')).toBeTruthy()
  })

  it('нулевой остаток помечается бейджем и гасит карточку', () => {
    const { container } = renderCard(product({ stock: 0 }))

    expect(screen.getByText('Нет в наличии')).toBeTruthy()

    const article = container.querySelector('article')
    expect(article?.className).toContain('opacity-60')
    expect(article?.className).toContain('grayscale')
  })

  it('остаток 1 показывает «Остался 1»', () => {
    renderCard(product({ stock: 1 }))

    expect(screen.getByText('Остался 1')).toBeTruthy()
  })

  it('остаток 2 показывает «Осталось 2»', () => {
    renderCard(product({ stock: 2 }))

    expect(screen.getByText('Осталось 2')).toBeTruthy()
  })

  it('остаток 3 показывает «Осталось 3»', () => {
    renderCard(product({ stock: 3 }))

    expect(screen.getByText('Осталось 3')).toBeTruthy()
  })

  it('запаса хватает — бейджа остатка нет', () => {
    renderCard(product({ stock: 5 }))

    expect(screen.queryByText(/^Остал/)).toBeNull()
    expect(screen.queryByText('Нет в наличии')).toBeNull()

    const { container } = renderCard(product({ stock: 5 }))
    const article = container.querySelector('article')
    expect(article?.className).not.toContain('grayscale')
  })

  it('ошибка загрузки фото просит свежую ссылку', () => {
    mocks.url = 'https://storage/broken.jpg'
    const { container } = renderCard(product({ media: [{ id: 'media-1', kind: 'photo' }] }))

    const img = container.querySelector('img')
    expect(img).toBeTruthy()

    fireEvent.error(img as HTMLImageElement)

    expect(mocks.renew).toHaveBeenCalledWith('media-1')
  })

  it('приоритетного мастера отмечает бейджем', () => {
    renderCard(
      product({
        childProfile: {
          id: 'cp-2',
          slug: 'anya',
          name: 'Аня',
          age: 9,
          city: null,
          hasDisability: true,
        },
      }),
    )

    expect(screen.getByText('Приоритетный мастер')).toBeTruthy()

    // Пояснение без диагноза и доступность с клавиатуры.
    const note = screen.getByRole('note')
    expect(note.getAttribute('title')).toContain(
      'Мастер с особыми потребностями. Поддержите его работу.',
    )
    expect(note.getAttribute('tabindex')).toBe('0')

    // Бейдж остаётся янтарным, медицинских данных нет.
    const badge = screen.getByText('Приоритетный мастер')
    expect(badge.className).toContain('bg-chip-amber-bg')
  })
})
