import { api } from '@/shared/api/client'

// Избранное покупателя.

export interface FavoriteProduct {
  id: string
  title: string
  priceKopecks: number
  stock: number
}

// Бэкенд отдаёт запись избранного с вложенным товаром — разворачиваем её плоским списком.
interface FavoriteRow {
  productId: string
  product?: FavoriteProduct | null
}

export const favoritesApi = {
  async list(): Promise<FavoriteProduct[]> {
    const { data } = await api.get<FavoriteRow[]>('/favorites')
    return (data ?? [])
      .map((row) => row.product)
      .filter((product): product is FavoriteProduct => Boolean(product?.id))
  },

  async add(productId: string): Promise<void> {
    await api.post(`/favorites/${productId}`)
  },

  async remove(productId: string): Promise<void> {
    await api.delete(`/favorites/${productId}`)
  },
}