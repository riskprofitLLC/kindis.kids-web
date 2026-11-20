import { beforeEach, describe, expect, it, vi } from 'vitest'

// Товары продавца зовут GET/POST/PATCH/DELETE клиента — мокаем весь набор.
const get = vi.fn()
const post = vi.fn()
const patch = vi.fn()
const del = vi.fn()

vi.mock('@/shared/api/client', () => ({
  api: {
    get: (...args: unknown[]) => get(...args),
    post: (...args: unknown[]) => post(...args),
    patch: (...args: unknown[]) => patch(...args),
    delete: (...args: unknown[]) => del(...args),
  },
}))

const { productsApi } = await import('@/shared/api/products-api')

function product(overrides: Record<string, unknown> = {}) {
  return {
    id: 'prd_1',
    title: 'Шкатулка',
    description: 'Из дерева',
    priceKopecks: 45000,
    stock: 2,
    status: 'active',
    categoryId: 'cat_1',
    createdAt: '2026-11-01T00:00:00.000Z',
    ...overrides,
  }
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('productsApi.mine', () => {
  it('собирает товары со всех профилей продавца', async () => {
    const first = product()
    const second = product({ id: 'prd_2', title: 'Брошь' })
    get.mockResolvedValueOnce({ data: [{ id: 'chd_1' }, { id: 'chd_2' }] })
    get.mockResolvedValueOnce({ data: [first] })
    get.mockResolvedValueOnce({ data: [second] })

    await expect(productsApi.mine()).resolves.toEqual([first, second])
    expect(get).toHaveBeenNthCalledWith(1, '/children/mine')
    expect(get).toHaveBeenNthCalledWith(2, '/children/chd_1/products')
    expect(get).toHaveBeenNthCalledWith(3, '/children/chd_2/products')
  })

  it('без профилей отдаёт пустой список', async () => {
    get.mockResolvedValueOnce({ data: [] })

    await expect(productsApi.mine()).resolves.toEqual([])
    expect(get).toHaveBeenCalledTimes(1)
  })
})

describe('productsApi.create', () => {
  it('создаёт товар в профиле ребёнка', async () => {
    const created = product({ status: 'draft' })
    post.mockResolvedValueOnce({ data: created })

    const input = { title: 'Шкатулка', priceKopecks: 45000, stock: 2 }
    await expect(productsApi.create('chd_1', input)).resolves.toEqual(created)
    expect(post).toHaveBeenCalledWith('/children/chd_1/products', input)
  })
})

describe('productsApi.update', () => {
  it('патчит частичные поля товара', async () => {
    const updated = product({ priceKopecks: 39000, stock: 5 })
    patch.mockResolvedValueOnce({ data: updated })

    const input = { priceKopecks: 39000, stock: 5 }
    await expect(productsApi.update('prd_1', input)).resolves.toEqual(updated)
    expect(patch).toHaveBeenCalledWith('/products/prd_1', input)
  })
})

describe('productsApi статусы', () => {
  it('submit отправляет товар на модерацию', async () => {
    const pending = product({ status: 'pending_review' })
    post.mockResolvedValueOnce({ data: pending })

    await expect(productsApi.submit('prd_1')).resolves.toEqual(pending)
    expect(post).toHaveBeenCalledWith('/products/prd_1/submit')
  })

  it('archive убирает товар в архив', async () => {
    const archived = product({ status: 'archived' })
    post.mockResolvedValueOnce({ data: archived })

    await expect(productsApi.archive('prd_1')).resolves.toEqual(archived)
    expect(post).toHaveBeenCalledWith('/products/prd_1/archive')
  })

  it('restore возвращает товар из архива', async () => {
    const restored = product({ status: 'active' })
    post.mockResolvedValueOnce({ data: restored })

    await expect(productsApi.restore('prd_1')).resolves.toEqual(restored)
    expect(post).toHaveBeenCalledWith('/products/prd_1/restore')
  })
})

describe('productsApi.remove', () => {
  it('удаляет товар и возвращает пустоту', async () => {
    del.mockResolvedValueOnce({ data: null })

    await expect(productsApi.remove('prd_1')).resolves.toBeUndefined()
    expect(del).toHaveBeenCalledWith('/products/prd_1')
  })
})

describe('productsApi.media', () => {
  it('возвращает привязанные медиа товара', async () => {
    const rows = [{ mediaId: 'med_1', sortOrder: 0, kind: 'photo' }]
    get.mockResolvedValueOnce({ data: rows })

    await expect(productsApi.media('prd_1')).resolves.toEqual(rows)
    expect(get).toHaveBeenCalledWith('/products/prd_1/media')
  })
})

describe('productsApi.attachMedia', () => {
  it('привязывает медиа к товару', async () => {
    const rows = [{ mediaId: 'med_1', sortOrder: 0, kind: 'photo' }]
    post.mockResolvedValueOnce({ data: rows })

    await expect(productsApi.attachMedia('prd_1', 'med_1')).resolves.toEqual(rows)
    expect(post).toHaveBeenCalledWith('/products/prd_1/media/med_1')
  })
})

describe('productsApi.reorderMedia', () => {
  it('меняет порядок фото списком id', async () => {
    const rows = [
      { mediaId: 'med_2', sortOrder: 0, kind: 'photo' },
      { mediaId: 'med_1', sortOrder: 1, kind: 'photo' },
    ]
    patch.mockResolvedValueOnce({ data: rows })

    await expect(productsApi.reorderMedia('prd_1', ['med_2', 'med_1'])).resolves.toEqual(rows)
    expect(patch).toHaveBeenCalledWith('/products/prd_1/media/order', {
      mediaIds: ['med_2', 'med_1'],
    })
  })
})

describe('productsApi.detachMedia', () => {
  it('отвязывает медиа от товара', async () => {
    del.mockResolvedValueOnce({ data: null })

    await expect(productsApi.detachMedia('prd_1', 'med_1')).resolves.toBeUndefined()
    expect(del).toHaveBeenCalledWith('/products/prd_1/media/med_1')
  })
})
