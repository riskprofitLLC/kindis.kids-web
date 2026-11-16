import { api } from '@/shared/api/client'
import type { Order } from '@/shared/api/orders-api'

// Кабинет продавца:сводка，графики，заказы по товарам，чаты.

export interface DashboardSummary {
  newOrders: number
  lowStockProducts: Array<{ id: string; title: string; stock: number }>
  profileViews: number
  revenue30DaysKopecks: number
}

export interface StatsDay {
  day: string
  views: number
  salesKopecks: number
  ordersCount: number
}

export interface SellerStats {
  days: StatsDay[]
  totals: { views: number; salesKopecks: number; ordersCount: number }
}

export interface SellerOrdersPage {
  items: Order[]
  nextCursor: string | null
  total: number
}

// Диалог по заказу:собеседник зависит от роли текущего пользователя.
export interface DialogSummary {
  orderId: string
  orderStatus?: string
  createdAt?: string
  role?: 'buyer' | 'seller'
  counterpartName: string
  // Последнее сообщение приходит объектом с флагом «моё».
  lastMessage: {
    id: string
    text: string
    createdAt: string
    senderId: string
    readAt: string | null
    mine: boolean
  } | null
  unreadCount: number
}

export interface ChatMessage {
  id: string
  text: string
  senderId: string
  readAt?: string | null
  createdAt: string
  // Автор вложенным объектом；для гостевых сообщений может быть null.
  sender?: { id?: string; fullName?: string | null } | null
}

export const sellerApi = {
  async dashboard(): Promise<DashboardSummary> {
    const { data } = await api.get<DashboardSummary>('/seller/dashboard')
    return data
  },

  async stats(from?: string, to?: string): Promise<SellerStats> {
    const { data } = await api.get<SellerStats>('/seller/stats', { params: { from, to } })
    return data
  },

  async orders(params?: {
    status?: string
    cursor?: string
    limit?: number
  }): Promise<SellerOrdersPage> {
    const { data } = await api.get<SellerOrdersPage>('/seller/orders', { params })
    return data
  },

  // Смена статуса:подтвердить → собрано → отправлено (+ трек-номер).
  async updateOrderStatus(
    orderId: string,
    status: string,
    trackingNumber?: string,
  ): Promise<Order> {
    const { data } = await api.patch<Order>(`/seller/orders/${orderId}/status`, {
      status,
      trackingNumber,
    })
    return data
  },

  async cancelOrder(orderId: string, reason: string): Promise<Order> {
    const { data } = await api.post<Order>(`/seller/orders/${orderId}/cancel`, { reason })
    return data
  },

  // ---------- Часы по заказам ----------

  async dialogs(): Promise<DialogSummary[]> {
    const { data } = await api.get<DialogSummary[]>('/messages/dialogs')
    return data
  },

  async messages(orderId: string): Promise<ChatMessage[]> {
    const { data } = await api.get<ChatMessage[]>(`/orders/${orderId}/messages`)
    return data
  },

  async sendMessage(orderId: string, text: string): Promise<ChatMessage> {
    const { data } = await api.post<ChatMessage>(`/orders/${orderId}/messages`, { text })
    return data
  },

  async markRead(orderId: string): Promise<void> {
    await api.post(`/orders/${orderId}/messages/read`)
  },
}
