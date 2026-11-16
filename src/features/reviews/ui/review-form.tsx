import { Star } from 'lucide-react'
import { useState } from 'react'

import { cn } from '@/shared/lib/cn'
import { Button } from '@/shared/ui/button/button'

interface ReviewFormProps {
  onSubmit: (rating: number, text: string) => void
  pending?: boolean
  error?: string | null
}

// Форма отзыва：оценка звёздами + текст. Доступна только по завершённым
// заказам — бэкенд перепроверяет и вернёт понятную ошибку.
export function ReviewForm({ onSubmit, pending, error }: ReviewFormProps) {
  const [rating, setRating] = useState(5)
  const [text, setText] = useState('')

  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={(event) => {
        event.preventDefault()
        onSubmit(rating, text.trim())
      }}
    >
      <fieldset className="flex flex-col gap-1">
        <legend className="text-sm font-medium text-text">Ваша оценка</legend>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              // Тач-таргет 44x44 даже при мелкой иконке.
              className="flex min-h-11 min-w-11 items-center justify-center rounded-md hover:bg-surface-muted"
              aria-label={`Поставить ${star} из 5`}
              aria-pressed={rating === star}
              onClick={() => setRating(star)}
            >
              <Star
                width={22}
                height={22}
                className={cn(
                  star <= rating ? 'fill-primary text-primary' : 'fill-none text-text-muted',
                )}
                strokeWidth={1.5}
              />
            </button>
          ))}
        </div>
      </fieldset>

      <label className="flex flex-col gap-1 text-sm">
        Текст отзыва
        <textarea
          rows={3}
          maxLength={1000}
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="Что понравилось，как шла сделка — необязательно"
          className="rounded-md border border-border px-3 py-2 text-sm"
        />
      </label>

      {error && (
        <p role="alert" className="text-xs text-danger">
          {error}
        </p>
      )}

      <Button type="submit" disabled={pending} className="self-start">
        {pending ? 'Отправляем…' : 'Опубликовать отзыв'}
      </Button>
    </form>
  )
}
