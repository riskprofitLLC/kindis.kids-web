import { Heart } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'

import { useSessionStore } from '@/entities/session/model/session-store'
import { useFavoriteIds, useToggleFavorite } from '@/features/favorites/model/use-favorites'
import { routes } from '@/shared/config/routes'
import { cn } from '@/shared/lib/cn'

interface FavoriteButtonProps {
  productId: string
  className?: string
}

// Сердце «в избранное»：гостей отправляем на вход，покупателю переключаем.
export function FavoriteButton({ productId, className }: FavoriteButtonProps) {
  const status = useSessionStore((state) => state.status)
  const navigate = useNavigate()
  const location = useLocation()
  const ids = useFavoriteIds()
  const toggle = useToggleFavorite()

  const inFavorite = ids.includes(productId)

  return (
    <button
      type="button"
      // Тач-таргет 44x44 даже при мелкой иконке.
      className={cn(
        'flex min-h-11 min-w-11 items-center justify-center rounded-full bg-surface/80 hover:bg-surface-muted',
        className,
      )}
      aria-pressed={inFavorite}
      aria-label={inFavorite ? 'Убрать из избранного' : 'В избранное'}
      disabled={toggle.isPending}
      onClick={() => {
        if (status !== 'authenticated') {
          void navigate(routes.login, { state: { from: location.pathname } })
          return
        }
        toggle.mutate({ productId, inFavorite })
      }}
    >
      <Heart
        width={22}
        height={22}
        strokeWidth={1.5}
        className={cn(inFavorite ? 'fill-danger text-danger' : 'fill-none text-text')}
      />
    </button>
  )
}