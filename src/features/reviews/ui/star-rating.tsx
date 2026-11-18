import { Star } from 'lucide-react'

import { cn } from '@/shared/lib/cn'

interface StarRatingProps {
  // Средний рейтинг — может быть дробным.
  value: number
  count?: number
  size?: 'sm' | 'md'
}

// Средний рейтинг звёздами:целые и половинные звёзды,подпись для скринридера.
export function StarRating({ value, count, size = 'md' }: StarRatingProps) {
  const rounded = Math.round(value * 2) / 2
  const px = size === 'sm' ? 14 : 18

  return (
    <span
      className="inline-flex items-center gap-1"
      role="img"
      aria-label={`Рейтинг ${value.toFixed(1)} из 5${count !== undefined ? `,${count} отзывов` : ''}`}
    >
      <span className="flex" aria-hidden="true">
        {[1, 2, 3, 4, 5].map((star) => {
          const filled = rounded >= star
          const half = !filled && rounded >= star - 0.5
          return (
            <Star
              key={star}
              width={px}
              height={px}
              className={cn(
                filled || half ? 'fill-primary text-primary' : 'fill-none text-text-muted',
              )}
              strokeWidth={1.5}
            />
          )
        })}
      </span>
      <span className="text-xs text-text-muted">
        {value > 0 ? value.toFixed(1) : 'нет оценок'}
        {count !== undefined && count > 0 ? ` (${count})` : ''}
      </span>
    </span>
  )
}
