import { beforeEach, describe, expect, it, vi } from 'vitest'

// Отзывы зовут GET/POST клиента — мокаем оба метода.
const get = vi.fn()
const post = vi.fn()

vi.mock('@/shared/api/client', () => ({
  api: {
    get: (...args: unknown[]) => get(...args),
    post: (...args: unknown[]) => post(...args),
  },
}))

const { reviewsApi } = await import('@/shared/api/reviews-api')

function review(overrides: Record<string, unknown> = {}) {
  return {
    id: 'rev_1',
    rating: 5,
    text: 'Отличная работа',
    createdAt: '2026-11-02T00:00:00.000Z',
    author: { id: 'usr_1', fullName: 'Ирина' },
    ...overrides,
  }
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('reviewsApi.create', () => {
  it('создаёт отзыв по позиции заказа', async () => {
    const created = review()
    post.mockResolvedValueOnce({ data: created })

    const input = { rating: 5, text: 'Отличная работа' }
    await expect(reviewsApi.create('itm_1', input)).resolves.toEqual(created)
    expect(post).toHaveBeenCalledWith('/order-items/itm_1/review', input)
  })

  it('без текста шлёт только оценку', async () => {
    const created = review({ text: null })
    post.mockResolvedValueOnce({ data: created })

    await reviewsApi.create('itm_1', { rating: 4 })

    expect(post).toHaveBeenCalledWith('/order-items/itm_1/review', { rating: 4 })
  })
})

describe('reviewsApi.forProduct', () => {
  it('возвращает отзывы товара', async () => {
    const list = [review(), review({ id: 'rev_2', rating: 4 })]
    get.mockResolvedValueOnce({ data: list })

    await expect(reviewsApi.forProduct('prd_1')).resolves.toEqual(list)
    expect(get).toHaveBeenCalledWith('/products/prd_1/reviews')
  })
})

describe('reviewsApi.productRating', () => {
  it('возвращает среднюю оценку и количество', async () => {
    const rating = { average: 4.5, count: 12 }
    get.mockResolvedValueOnce({ data: rating })

    await expect(reviewsApi.productRating('prd_1')).resolves.toEqual(rating)
    expect(get).toHaveBeenCalledWith('/products/prd_1/rating')
  })
})

describe('reviewsApi.forSeller', () => {
  it('возвращает отзывы витрины продавца сводкой', async () => {
    const page = { items: [review()], average: 5, count: 1 }
    get.mockResolvedValueOnce({ data: page })

    await expect(reviewsApi.forSeller('masha')).resolves.toEqual(page)
    expect(get).toHaveBeenCalledWith('/children/by-slug/masha/reviews')
  })
})
