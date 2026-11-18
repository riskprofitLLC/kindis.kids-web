import { api } from '@/shared/api/client'

// Корзина на сервере:гость опознаётся заголовком X-Cart-Session,
// авторизованный — своим токеном. Цены в копейках.

export interface CartProduct {
  id: string
  title: string
  priceKopecks: number
  stock: number
  status: string
}

export interface CartItem {
  id: string
  productId: string
  quantity: number
  product: CartProduct
}

export interface Cart {
  id: string
  items: CartItem[]
}

export const cartApi = {
  async get(): Promise<Cart | null> {
    const { data } = await api.get<Cart | null>('/cart')
    return data
  },

  async addItem(productId: string, quantity = 1): Promise<CartItem> {
    const { data } = await api.post<CartItem>('/cart/items', { productId, quantity })
    return data
  },

  async updateQuantity(itemId: string, quantity: number): Promise<CartItem> {
    const { data } = await api.patch<CartItem>(`/cart/items/${itemId}`, { quantity })
    return data
  },

  async removeItem(itemId: string): Promise<void> {
    await api.delete(`/cart/items/${itemId}`)
  },

  async clear(): Promise<void> {
    await api.delete('/cart')
  },

  // Слияние гостевой корзины с пользовательской после входа.
  async merge(): Promise<void> {
    await api.post('/cart/merge')
  },

  // Тот же merge,но с явной сессией:после входа токен уже стоит,
  // и перехватчик сам заголовок не добавит.
  async mergeWithSession(sessionId: string): Promise<void> {
    await api.post('/cart/merge', undefined, {
      headers: { 'X-Cart-Session': sessionId },
    })
  },
}
