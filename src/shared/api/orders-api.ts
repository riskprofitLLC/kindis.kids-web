import { api } from '@/shared/api/client'
import type { DeliveryMethod } from '@/shared/domain/cart'

// Заказы:оформление из серверной корзины,история,отмена.

export interface Order {
  id: string
  status: 'created' | 'confirmed' | 'assembling' | 'shipped' | 'delivered' | 'cancelled'
  totalKopecks: number
  deliveryMethod: DeliveryMethod | null
  addressJson: Record<string, unknown> | null
  comment: string | null
  trackingNumber: string | null
  cancelReason: string | null
  createdAt: string
}

export interface CheckoutInput {
  deliveryMethod: DeliveryMethod
  address?: Record<string, unknown>
  comment?: string
}

// Статусы заказа и человекочитаемые подписи — общие для покупателя и продавца.
export const ORDER_STATUS_LABELS: Record<Order['status'], string> = {
  created: 'Оформлен',
  confirmed: 'Подтверждён',
  assembling: 'В сборке',
  shipped: 'Отправлен',
  delivered: 'Доставлен',
  cancelled: 'Отменён',
}

// Отмена покупателем — только в этих статусах；сервер перепроверяет переход.
export const BUYER_CANCELABLE: Order['status'][] = ['created', 'confirmed']

export interface OrderItem {
  id: string
  productId: string | null
  quantity: number
  priceKopecks: number
  titleSnapshot: string
}

export interface OrderDetail extends Order {
  items: OrderItem[]
}

export const ordersApi = {
  // Список отдаётся с позициями — на них же можно оставлять отзывы.
  async mine(): Promise<OrderDetail[]> {
    const { data } = await api.get<OrderDetail[]>('/orders')
    return data
  },

  async byId(id: string): Promise<OrderDetail> {
    const { data } = await api.get<OrderDetail>(`/orders/${id}`)
    return data
  },

  async cancel(id: string, reason?: string): Promise<Order> {
    const { data } = await api.post<Order>(`/orders/${id}/cancel`, { reason })
    return data
  },

  // Ключ идемпотентности на стороне клиента:повторный запрос не создаст
  // второй заказ,а вернёт уже созданный.
  async checkout(input: CheckoutInput, idempotencyKey: string): Promise<Order> {
    const { data } = await api.post<Order>('/orders', input, {
      params: { idempotencyKey },
    })
    return data
  },
}
