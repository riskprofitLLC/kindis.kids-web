import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { type Review, reviewsApi } from '@/shared/api/reviews-api'

// Отзывы товара：список и средний рейтинг.
export function useProductReviews(productId: string | undefined) {
  const queryClient = useQueryClient()

  const reviews = useQuery({
    queryKey: ['product-reviews', productId],
    enabled: Boolean(productId),
    queryFn: () => reviewsApi.forProduct(productId as string),
  })

  const rating = useQuery({
    queryKey: ['product-rating', productId],
    enabled: Boolean(productId),
    queryFn: () => reviewsApi.productRating(productId as string),
  })

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['product-reviews', productId] })
    void queryClient.invalidateQueries({ queryKey: ['product-rating', productId] })
  }

  return { reviews, rating, invalidate }
}

// Отзыв по позиции завершённого заказа.
export function useCreateReview(onDone: () => void) {
  return useMutation({
    mutationFn: ({
      orderItemId,
      rating,
      text,
    }: {
      orderItemId: string
      rating: number
      text?: string
    }) => reviewsApi.create(orderItemId, { rating, text }),
    onSuccess: onDone,
  })
}

// Отзывы на витрине продавца.
export function useSellerReviews(slug: string | undefined) {
  return useQuery({
    queryKey: ['seller-reviews', slug],
    enabled: Boolean(slug),
    queryFn: () => reviewsApi.forSeller(slug as string),
  })
}

export type { Review }
