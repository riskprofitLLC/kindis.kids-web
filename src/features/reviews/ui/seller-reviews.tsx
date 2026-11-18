import { useSellerReviews } from '@/features/reviews/model/use-reviews'
import { ReviewList } from '@/features/reviews/ui/review-list'
import { StarRating } from '@/features/reviews/ui/star-rating'
import { Skeleton } from '@/shared/ui/skeleton/skeleton'
import { LoadingRegion } from '@/shared/ui/skeleton/skeleton-loading-region'

interface SellerReviewsProps {
  slug: string
}

// Отзывы на витрине продавца:средний рейтинг по всем его товарам.
export function SellerReviews({ slug }: SellerReviewsProps) {
  const reviews = useSellerReviews(slug)

  if (reviews.isPending) {
    return (
      <LoadingRegion>
        <Skeleton className="h-20 w-full" />
      </LoadingRegion>
    )
  }

  const data = reviews.data

  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-lg font-semibold text-text">Отзывы покупателей</h2>
        {data && data.count > 0 && <StarRating value={data.average} count={data.count} />}
      </div>
      <ReviewList
        items={data?.items ?? []}
        emptyText="Отзывов пока нет — этот мастер ждёт своих первых покупателей."
      />
    </section>
  )
}
