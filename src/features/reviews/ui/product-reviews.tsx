import { useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'

import { useSessionStore } from '@/entities/session/model/session-store'
import { useReviewableItems } from '@/features/reviews/model/use-reviewable-items'
import { useCreateReview, useProductReviews } from '@/features/reviews/model/use-reviews'
import { ReviewForm } from '@/features/reviews/ui/review-form'
import { ReviewList } from '@/features/reviews/ui/review-list'
import { StarRating } from '@/features/reviews/ui/star-rating'
import { ApiError } from '@/shared/api/errors'
import { formatDate } from '@/shared/lib/format'
import { FormField } from '@/shared/ui/form-field/form-field'
import { Skeleton } from '@/shared/ui/skeleton/skeleton'
import { LoadingRegion } from '@/shared/ui/skeleton/skeleton-loading-region'

interface ProductReviewsProps {
  productId: string
}

// Отзывы товара:средний рейтинг,список,форма для покупателей
// с завершённым заказом этого товара.
export function ProductReviews({ productId }: ProductReviewsProps) {
  const queryClient = useQueryClient()
  const userId = useSessionStore((state) => state.user?.id)
  const { reviews, rating, invalidate } = useProductReviews(productId)
  const reviewable = useReviewableItems(productId)
  const [error, setError] = useState<string | null>(null)
  // Выбранная позиция заказа：товар могли купить несколько раз.
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null)
  // Счётчик перемонтирует форму после успеха — поля очищаются.
  const [formKey, setFormKey] = useState(0)
  // Отзыв отправлен — форму скрываем:бэкенд не даёт второй отзыв по позиции.
  const [submitted, setSubmitted] = useState(false)

  const createReview = useCreateReview(() => {
    setError(null)
    setSubmitted(true)
    setFormKey((key) => key + 1)
    invalidate()
    void queryClient.invalidateQueries({ queryKey: ['reviewable-items', productId] })
  })

  // Свой отзыв в списке — значит,по позиции заказа второй отзыв не оставить.
  const alreadyReviewed = (reviews.data ?? []).some((review) => review.author?.id === userId)

  const reviewableItems = reviewable.data ?? []
  // По умолчанию берём первую позицию，пока покупатель не выбрал другую.
  const selectedItem =
    reviewableItems.find((item) => item.id === selectedItemId) ?? reviewableItems[0]

  const canReview = !submitted && !alreadyReviewed && reviewableItems.length > 0

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-lg font-semibold text-text">Отзывы</h2>
        {rating.data && <StarRating value={rating.data.average} count={rating.data.count} />}
      </div>

      {reviews.isPending ? (
        <LoadingRegion>
          <Skeleton className="h-20 w-full" />
        </LoadingRegion>
      ) : (
        <ReviewList items={reviews.data ?? []} emptyText="Отзывов пока нет — станьте первым." />
      )}

      {/* Форма только по завершённому заказу — иначе бэкенд отклонит */}
      {canReview && (
        <div className="rounded-card border border-border p-4">
          <h3 className="mb-3 text-sm font-semibold text-text">Оставить отзыв</h3>

          {/* Несколько покупок — выбираем，по какой позиции отзыв */}
          {reviewableItems.length > 1 && (
            <FormField name="orderItem" label="По какой покупке" className="mb-3">
              {(props) => (
                <select
                  {...props}
                  className="min-h-11 rounded-md border border-border px-3 text-sm"
                  value={selectedItem?.id ?? ''}
                  onChange={(event) => setSelectedItemId(event.target.value)}
                >
                  {reviewableItems.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.titleSnapshot}
                      {item.quantity > 1 ? ` × ${item.quantity}` : ''} — заказ от{' '}
                      {formatDate(item.orderDate)}
                    </option>
                  ))}
                </select>
              )}
            </FormField>
          )}

          <ReviewForm
            key={`${formKey}-${selectedItem?.id ?? 'none'}`}
            pending={createReview.isPending}
            error={error}
            onSubmit={(value, text) => {
              setError(null)
              if (!selectedItem) return
              createReview.mutate(
                { orderItemId: selectedItem.id, rating: value, text },
                {
                  onError: (mutationError) =>
                    setError(
                      mutationError instanceof ApiError
                        ? mutationError.message
                        : 'Не удалось опубликовать отзыв',
                    ),
                },
              )
            }}
          />
        </div>
      )}
    </section>
  )
}
