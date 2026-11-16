import { useQuery } from '@tanstack/react-query'

import { useSessionStore } from '@/entities/session/model/session-store'
import type { OrderDetail } from '@/shared/api/orders-api'
import { ordersApi } from '@/shared/api/orders-api'

// Заказы покупателя с этим товаром — диалог с продавцом открывается по заказу.
export function useProductOrders(productId: string | undefined, enabled = true) {
  const status = useSessionStore((state) => state.status)

  return useQuery({
    queryKey: ['product-orders', productId],
    // Гости заказов не имеют：запрос ушёл бы в 401.
    enabled: Boolean(productId) && status === 'authenticated' && enabled,
    queryFn: async () => {
      const orders = await ordersApi.mine()
      return orders
        .filter((order) => order.items.some((item) => item.productId === productId))
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    },
  })
}

export type { OrderDetail }