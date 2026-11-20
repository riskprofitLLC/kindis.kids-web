import { beforeEach, describe, expect, it, vi } from 'vitest'

// Кабинет админа зовёт только GET/POST/DELETE клиента.
const get = vi.fn()
const post = vi.fn()
const del = vi.fn()

vi.mock('@/shared/api/client', () => ({
  api: {
    get: (...args: unknown[]) => get(...args),
    post: (...args: unknown[]) => post(...args),
    delete: (...args: unknown[]) => del(...args),
  },
}))

const { adminApi } = await import('@/shared/api/admin-api')

beforeEach(() => {
  vi.clearAllMocks()
})

describe('adminApi — модерация', () => {
  it('counts читает счётчики очередей', async () => {
    const counts = { profiles: 1, products: 2, media: 3, reviews: 4, reports: 5 }
    get.mockResolvedValueOnce({ data: counts })

    await expect(adminApi.counts()).resolves.toEqual(counts)
    expect(get).toHaveBeenCalledWith('/admin/moderation/counts')
  })

  it('profiles/products/media/reviews/reports читают свои очереди', async () => {
    get.mockResolvedValue({ data: [] })

    await adminApi.profiles()
    await adminApi.products()
    await adminApi.media()
    await adminApi.reviews()
    await adminApi.reports()

    expect(get).toHaveBeenNthCalledWith(1, '/admin/moderation/profiles')
    expect(get).toHaveBeenNthCalledWith(2, '/admin/moderation/products')
    expect(get).toHaveBeenNthCalledWith(3, '/admin/moderation/media')
    expect(get).toHaveBeenNthCalledWith(4, '/admin/moderation/reviews')
    expect(get).toHaveBeenNthCalledWith(5, '/admin/moderation/reports')
  })

  it('act без причины шлёт голый POST по составному пути', async () => {
    post.mockResolvedValueOnce({ data: null })

    await adminApi.act('products', 'p-1', 'approve')

    expect(post).toHaveBeenCalledWith('/admin/moderation/products/p-1/approve', undefined)
  })

  it('act с причиной кладёт её в тело запроса', async () => {
    post.mockResolvedValueOnce({ data: null })

    await adminApi.act('reviews', 'r-1', 'reject', 'Спам')

    expect(post).toHaveBeenCalledWith('/admin/moderation/reviews/r-1/reject', { reason: 'Спам' })
  })

  it('resolveReport фиксирует статус жалобы', async () => {
    post.mockResolvedValueOnce({ data: null })

    await adminApi.resolveReport('rep-1', 'resolved')

    expect(post).toHaveBeenCalledWith('/admin/moderation/reports/rep-1/resolve', {
      status: 'resolved',
    })
  })
})

describe('adminApi — справочники и аудит', () => {
  it('categories читает дерево категорий', async () => {
    get.mockResolvedValueOnce({ data: [{ id: 'c-1' }] })

    await expect(adminApi.categories()).resolves.toEqual([{ id: 'c-1' }])
    expect(get).toHaveBeenCalledWith('/categories')
  })

  it('createCategory создаёт категорию и возвращает её', async () => {
    const created = { id: 'c-2' }
    post.mockResolvedValueOnce({ data: created })

    await expect(
      adminApi.createCategory({ name: 'Игрушки', slug: 'toys' }),
    ).resolves.toEqual(created)
    expect(post).toHaveBeenCalledWith('/categories/admin', { name: 'Игрушки', slug: 'toys' })
  })

  it('deleteCategory удаляет категорию по id', async () => {
    del.mockResolvedValueOnce({ data: null })

    await adminApi.deleteCategory('c-2')

    expect(del).toHaveBeenCalledWith('/categories/admin/c-2')
  })

  it('attributes читает список характеристик', async () => {
    get.mockResolvedValueOnce({ data: [] })

    await expect(adminApi.attributes()).resolves.toEqual([])
    expect(get).toHaveBeenCalledWith('/attributes')
  })

  it('createAttribute создаёт характеристику со значениями select', async () => {
    const created = { id: 'a-1' }
    post.mockResolvedValueOnce({ data: created })

    await expect(
      adminApi.createAttribute({ name: 'Материал', type: 'select', values: ['Дуб', 'Сосна'] }),
    ).resolves.toEqual(created)
    expect(post).toHaveBeenCalledWith('/attributes/admin', {
      name: 'Материал',
      type: 'select',
      values: ['Дуб', 'Сосна'],
    })
  })

  it('deleteAttribute удаляет характеристику по id', async () => {
    del.mockResolvedValueOnce({ data: null })

    await adminApi.deleteAttribute('a-1')

    expect(del).toHaveBeenCalledWith('/attributes/admin/a-1')
  })

  it('audit пробрасывает фильтры как params и возвращает записи', async () => {
    const rows = [{ id: 'log-1' }]
    get.mockResolvedValueOnce({ data: rows })
    const params = { entityType: 'child_profile', limit: 50 }

    await expect(adminApi.audit(params)).resolves.toEqual(rows)
    expect(get).toHaveBeenCalledWith('/admin/audit', { params })
  })
})
