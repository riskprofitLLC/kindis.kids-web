import { useState } from 'react'

import { useAddToCart, useCart } from '@/entities/cart/model/use-cart'
import { ApiError } from '@/shared/api/errors'
import { Button } from '@/shared/ui/button/button'

interface AddToCartButtonProps {
  productId: string
  stock: number
}

// Добавление в корзину：остаток и конфликты проверяет сервер，
// его ответ показываем как есть — без выдумывания причин.
export function AddToCartButton({ productId, stock }: AddToCartButtonProps) {
  const addToCart = useAddToCart()
  const cart = useCart()
  const [error, setError] = useState<string | null>(null)

  const inCart = cart.data?.items.find((item) => item.productId === productId)

  if (stock <= 0) {
    return (
      <Button type="button" disabled>
        Нет в наличии
      </Button>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <Button
        type="button"
        disabled={addToCart.isPending}
        onClick={() => {
          setError(null)
          addToCart.mutate(
            { productId },
            {
              onError: (mutationError) =>
                setError(
                  mutationError instanceof ApiError
                    ? mutationError.message
                    : 'Не удалось добавить в корзину',
                ),
            },
          )
        }}
      >
        {addToCart.isPending ? 'Добавляем…' : 'Добавить в корзину'}
      </Button>
      {inCart && <p className="text-xs text-text-muted">В корзине: {inCart.quantity} шт.</p>}
      {error && (
        <p role="alert" className="text-xs text-danger">
          {error}
        </p>
      )}
    </div>
  )
}
