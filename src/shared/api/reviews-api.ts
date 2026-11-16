import { api } from '@/shared/api/client'

// Отзывы：создание по позиции завершённого заказа，публичные списки и рейтинг.

export interface Review {
  id: string
  rating: number
  text: string | null
  createdAt: string
  author: { id: string; fullName: string | null } | null
  // На витрине продавца дополнительно — к какому товару отзыв.
  orderItem?: { titleSnapshot: string; productId: string } | null
}

export interface ProductRating {
  average: number
  count: number
}

export const reviewsApi = {
  // Отзыв по позиции заказа：бэкенд принимает только из завершённых заказов.
  async create(orderItemId: string, input: { rating: number; text?: string }): Promise<Review> {
    const { data } = await api.post<Review>(`/order-items/${orderItemId}/review`, input)
    return data
  },

  async forProduct(productId: string): Promise<Review[]> {
    const { data } = await api.get<Review[]>(`/products/${productId}/reviews`)
    return data
  },

  async productRating(productId: string): Promise<ProductRating> {
    const { data } = await api.get<ProductRating>(`/products/${productId}/rating`)
    return data
  },

  async forSeller(slug: string): Promise<{ items: Review[]; average: number; count: number }> {
    const { data } = await api.get<{ items: Review[]; average: number; count: number }>(
      `/children/by-slug/${slug}/reviews`,
    )
    return data
  },
}
