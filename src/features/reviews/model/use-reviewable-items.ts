import { useQuery } from '@tanstack/react-query'

import { useSessionStore } from '@/entities/session/model/session-store'
import { ordersApi } from '@/shared/api/orders-api'

// Позиции завершённых заказов покупателя по товару — по ним можно отзываться.
export function useReviewableItems(productId: string | undefined) {
  const status = useSessionStore((state) => state.status)

  return useQuery({
    queryKey: ['reviewable-items', productId],
    // Гости не могут иметь заказов：запрос ушёл бы в 401.
    enabled: Boolean(productId) && status === 'authenticated',
    queryFn: async () => {
      const orders = await ordersApi.mine()
      return orders
        .filter((order) => order.status === 'delivered')
        .flatMap((order) => order.items)
        .filter((item) => item.productId === productId)
    },
  })
}
