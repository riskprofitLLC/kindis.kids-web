import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRef } from 'react'

import type { Cart } from '@/shared/api/cart-api'
import { type CheckoutInput, ordersApi } from '@/shared/api/orders-api'

interface Attempt {
  key: string
  signature: string
}

// Подпись попытки:состав корзины,способ доставки,адрес,комментарий.
function attemptSignature(input: CheckoutInput, cart: Cart | null | undefined): string {
  const items = (cart?.items ?? []).map((item) => [item.productId, item.quantity])
  return JSON.stringify([items, input.deliveryMethod, input.address ?? null, input.comment ?? null])
}

function newKey(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `order-${Date.now()}`
}

// Оформление заказа. Ключ идемпотентности живёт на одну попытку:новые данные —
// новый ключ,повтор с теми же данными（сетевой сбой）переиспользует старый,
// успех ключ сбрасывает.
export function useCheckout() {
  const queryClient = useQueryClient()
  const attemptRef = useRef<Attempt | null>(null)

  return useMutation({
    mutationFn: (input: CheckoutInput) => {
      const signature = attemptSignature(input, queryClient.getQueryData<Cart>(['cart']))
      if (!attemptRef.current || attemptRef.current.signature !== signature) {
        attemptRef.current = { key: newKey(), signature }
      }
      return ordersApi.checkout(input, attemptRef.current.key)
    },
    onSuccess: () => {
      // Заказ создан:следующая попытка обязана получить свой ключ.
      attemptRef.current = null
      void queryClient.invalidateQueries({ queryKey: ['cart'] })
    },
  })
}