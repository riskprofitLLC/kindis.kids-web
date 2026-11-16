// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { ProductCard } from '@/features/catalog/ui/product-card'
import type { ProductCard as ProductCardModel } from '@/shared/api/catalog-api'

vi.mock('@/features/media/model/use-media-url', () => ({
  useMediaUrl: () => null,
}))

// Без globals RTL не чистит DOM сам — делаем это вручную между тестами.
afterEach(cleanup)

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
    photoMediaIds: [],
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
    renderCard(product({ photoMediaIds: [] }))

    expect(screen.getByText('Фото нет')).toBeTruthy()
  })

  it('нулевой остаток помечается бейджем', () => {
    renderCard(product({ stock: 0 }))

    expect(screen.getByText('Нет в наличии')).toBeTruthy()
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
  })
})