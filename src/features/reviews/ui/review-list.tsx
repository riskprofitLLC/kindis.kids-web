import { StarRating } from '@/features/reviews/ui/star-rating'
import type { Review } from '@/shared/api/reviews-api'
import { formatDate } from '@/shared/lib/format'

interface ReviewListProps {
  items: Review[]
  emptyText: string
}

// Список отзывов：автор，звёзды，дата，текст.
export function ReviewList({ items, emptyText }: ReviewListProps) {
  if (items.length === 0) {
    return <p className="text-sm text-text-muted">{emptyText}</p>
  }

  return (
    <ul className="flex flex-col gap-3">
      {items.map((review) => (
        <li key={review.id} className="flex flex-col gap-1 rounded-card border border-border p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-sm font-medium text-text">
              {review.author?.fullName ?? 'Покупатель'}
            </span>
            <StarRating value={review.rating} size="sm" />
          </div>
          {review.orderItem && (
            <p className="text-xs text-text-muted">Товар：{review.orderItem.titleSnapshot}</p>
          )}
          {review.text && <p className="text-sm text-text">{review.text}</p>}
          <p className="text-xs text-text-muted">{formatDate(review.createdAt)}</p>
        </li>
      ))}
    </ul>
  )
}
