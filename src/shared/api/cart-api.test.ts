import { beforeEach, describe, expect, it, vi } from 'vitest'

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

const { cartApi } = await import('@/shared/api/cart-api')

beforeEach(() => {
  vi.clearAllMocks()
})

describe('cartApi', () => {
  it('get читает корзину', async () => {
    get.mockResolvedValueOnce({ data: { id: 'c-1', items: [] } })

    await expect(cartApi.get()).resolves.toEqual({ id: 'c-1', items: [] })
    expect(get).toHaveBeenCalledWith('/cart')
  })

  it('addItem шлёт товар и количество', async () => {
    post.mockResolvedValueOnce({ data: { id: 'i-1' } })

    await cartApi.addItem('p-1', 2)

    expect(post).toHaveBeenCalledWith('/cart/items', { productId: 'p-1', quantity: 2 })
  })

  it('addItem без количества берёт одно', async () => {
    post.mockResolvedValueOnce({ data: { id: 'i-1' } })

    await cartApi.addItem('p-1')

    expect(post).toHaveBeenCalledWith('/cart/items', { productId: 'p-1', quantity: 1 })
  })

  it('updateQuantity патчит позицию', async () => {
    patch.mockResolvedValueOnce({ data: { id: 'i-1' } })

    await cartApi.updateQuantity('i-1', 5)

    expect(patch).toHaveBeenCalledWith('/cart/items/i-1', { quantity: 5 })
  })

  it('removeItem удаляет позицию', async () => {
    del.mockResolvedValueOnce({ data: null })

    await cartApi.removeItem('i-1')

    expect(del).toHaveBeenCalledWith('/cart/items/i-1')
  })

  it('clear очищает корзину целиком', async () => {
    del.mockResolvedValueOnce({ data: null })

    await cartApi.clear()

    expect(del).toHaveBeenCalledWith('/cart')
  })

  it('merge сливает гостевую корзину с пользовательской', async () => {
    post.mockResolvedValueOnce({ data: null })

    await cartApi.merge()

    expect(post).toHaveBeenCalledWith('/cart/merge')
  })

  it('mergeWithSession явно передаёт заголовок сессии', async () => {
    post.mockResolvedValueOnce({ data: null })

    await cartApi.mergeWithSession('guest-1')

    // После входа токен уже стоит, поэтому сессию гостем шлём руками.
    expect(post).toHaveBeenCalledWith('/cart/merge', undefined, {
      headers: { 'X-Cart-Session': 'guest-1' },
    })
  })
})