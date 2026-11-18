import type { ProductCard, RawProduct } from '@/shared/api/catalog-api'
import { toCard } from '@/shared/api/catalog-api'
import { api } from '@/shared/api/client'

// Избранное покупателя.

// Товар из избранного — такой же, как карточка каталога: с фото, продавцом и категорией.
export type FavoriteProduct = ProductCard

// Бэкенд отдаёт запись избранного с вложенным товаром — разворачиваем её плоским списком.
interface FavoriteRow {
  productId: string
  // Сырой товар с бэкенда — приводим к карточке общим маппером каталога.
  product?: RawProduct | null
}

export const favoritesApi = {
  async list(): Promise<FavoriteProduct[]> {
    const { data } = await api.get<FavoriteRow[]>('/favorites')
    return (data ?? [])
      .map((row) => row.product)
      .filter((product): product is RawProduct => Boolean(product?.id))
      .map(toCard)
  },

  async add(productId: string): Promise<void> {
    await api.post(`/favorites/${productId}`)
  },

  async remove(productId: string): Promise<void> {
    await api.delete(`/favorites/${productId}`)
  },
}