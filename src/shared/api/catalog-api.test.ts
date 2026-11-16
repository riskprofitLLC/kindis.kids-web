import { beforeEach, describe, expect, it, vi } from 'vitest'

const get = vi.fn()

vi.mock('@/shared/api/client', () => ({
  api: { get: (...args: unknown[]) => get(...args), post: vi.fn() },
}))

const { catalogApi } = await import('@/shared/api/catalog-api')

function rawProduct(overrides: Record<string, unknown> = {}) {
  return {
    id: 'p-1',
    title: 'Шкатулка',
    description: 'Из дерева',
    priceKopecks: 45_000,
    stock: 2,
    createdAt: '2026-11-01T00:00:00.000Z',
    category: { id: 'c-1', name: 'Роспись', slug: 'wood-painting' },
    childProfile: null,
    ...overrides,
  }
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('catalogApi.search', () => {
  it('маппит товары и пробрасывает курсор с тоталом', async () => {
    get.mockResolvedValueOnce({
      data: { items: [rawProduct()], nextCursor: 'cursor-2', total: 7 },
    })

    const page = await catalogApi.search({ query: 'шкатулка', sort: 'price_asc' })

    expect(get).toHaveBeenCalledWith('/catalog', {
      params: { query: 'шкатулка', sort: 'price_asc' },
    })
    expect(page.items[0]).toMatchObject({ id: 'p-1', title: 'Шкатулка', photoMediaIds: [] })
    expect(page.nextCursor).toBe('cursor-2')
    expect(page.total).toBe(7)
  })

  it('фото сортируются по sortOrder, пустые отбрасываются', async () => {
    get.mockResolvedValueOnce({
      data: {
        items: [
          rawProduct({
            media: [
              { sortOrder: 2, media: { id: 'm-2' } },
              { sortOrder: 1, media: null },
              { sortOrder: 3, media: { id: 'm-3' } },
            ],
          }),
        ],
        nextCursor: null,
        total: 1,
      },
    })

    const page = await catalogApi.search({})

    expect(page.items[0].photoMediaIds).toEqual(['m-2', 'm-3'])
  })

  it('пустая выдача не ломает маппинг', async () => {
    get.mockResolvedValueOnce({ data: { items: [], nextCursor: null, total: 0 } })

    const page = await catalogApi.search({})

    expect(page.items).toEqual([])
  })
})

describe('catalogApi.product', () => {
  it('характеристики превращаются в строки таблицы', async () => {
    get.mockResolvedValueOnce({
      data: rawProduct({
        rating: 4.5,
        reviewsCount: 3,
        attributes: [
          { attribute: { name: 'Материал' }, value: { value: 'Дуб' } },
          { attribute: { name: 'Описание' }, textValue: 'Ручная роспись' },
          { attribute: { name: 'Высота', unit: 'см' }, numberValue: 12 },
        ],
      }),
    })

    const detail = await catalogApi.product('p-1')

    expect(get).toHaveBeenCalledWith('/products/public/p-1')
    expect(detail.specs).toEqual([
      { name: 'Материал', value: 'Дуб' },
      { name: 'Описание', value: 'Ручная роспись' },
      // Число с единицей измерения характеристики.
      { name: 'Высота', value: '12 см' },
    ])
    expect(detail.rating).toBe(4.5)
    expect(detail.reviewsCount).toBe(3)
  })

  it('пустая характеристика даёт прочерк, рейтинг по умолчанию нулевой', async () => {
    get.mockResolvedValueOnce({
      data: rawProduct({ attributes: [{ attribute: { name: 'Без значения' } }] }),
    })

    const detail = await catalogApi.product('p-1')

    expect(detail.specs).toEqual([{ name: 'Без значения', value: '—' }])
    expect(detail.rating).toBeNull()
    expect(detail.reviewsCount).toBe(0)
  })
})