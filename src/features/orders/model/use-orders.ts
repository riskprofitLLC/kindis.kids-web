import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { ordersApi } from '@/shared/api/orders-api'

export function useMyOrders() {
  return useQuery({
    queryKey: ['my-orders'],
    queryFn: () => ordersApi.mine(),
  })
}

export function useOrder(id: string | undefined) {
  return useQuery({
    queryKey: ['order', id],
    enabled: Boolean(id),
    queryFn: () => ordersApi.byId(id as string),
  })
}

// Отмена заказа покупателем — в допустимых статусах.
export function useCancelOrder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) => ordersApi.cancel(id, reason),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['my-orders'] })
      void queryClient.invalidateQueries({ queryKey: ['order'] })
    },
  })
}
