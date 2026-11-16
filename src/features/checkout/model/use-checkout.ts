import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRef } from 'react'

import { type CheckoutInput,ordersApi } from '@/shared/api/orders-api'

// Оформление заказа. Ключ идемпотентности выдаётся один раз на попытку：
// повторный клик или обновление страницы не создадут второй заказ.
export function useCheckout() {
  const queryClient = useQueryClient()
  const keyRef = useRef<string | null>(null)

  return useMutation({
    mutationFn: (input: CheckoutInput) => {
      if (!keyRef.current) {
        keyRef.current =
          typeof crypto !== 'undefined' && 'randomUUID' in crypto
            ? crypto.randomUUID()
            : `order-${Date.now()}`
      }
      return ordersApi.checkout(input, keyRef.current)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['cart'] })
    },
  })
}