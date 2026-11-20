import { beforeEach, describe, expect, it, vi } from 'vitest'

// Кабинет продавца зовёт GET/POST/PATCH клиента — мокаем эти методы.
const get = vi.fn()
const post = vi.fn()
const patch = vi.fn()

vi.mock('@/shared/api/client', () => ({
  api: {
    get: (...args: unknown[]) => get(...args),
    post: (...args: unknown[]) => post(...args),
    patch: (...args: unknown[]) => patch(...args),
  },
}))

const { sellerApi } = await import('@/shared/api/seller-api')

beforeEach(() => {
  vi.clearAllMocks()
})

describe('sellerApi.dashboard', () => {
  it('возвращает сводку кабинета', async () => {
    const summary = {
      newOrders: 3,
      lowStockProducts: [{ id: 'prd_1', title: 'Шкатулка', stock: 1 }],
      profileViews: 120,
      revenue30DaysKopecks: 250000,
    }
    get.mockResolvedValueOnce({ data: summary })

    await expect(sellerApi.dashboard()).resolves.toEqual(summary)
    expect(get).toHaveBeenCalledWith('/seller/dashboard')
  })
})

describe('sellerApi.stats', () => {
  it('передаёт границы периода в параметрах', async () => {
    const stats = {
      days: [{ day: '2026-11-01', views: 10, salesKopecks: 45000, ordersCount: 1 }],
      totals: { views: 10, salesKopecks: 45000, ordersCount: 1 },
    }
    get.mockResolvedValueOnce({ data: stats })

    await expect(sellerApi.stats('2026-11-01', '2026-11-18')).resolves.toEqual(stats)
    expect(get).toHaveBeenCalledWith('/seller/stats', {
      params: { from: '2026-11-01', to: '2026-11-18' },
    })
  })

  it('без периода шлёт пустые границы', async () => {
    const stats = { days: [], totals: { views: 0, salesKopecks: 0, ordersCount: 0 } }
    get.mockResolvedValueOnce({ data: stats })

    await sellerApi.stats()

    expect(get).toHaveBeenCalledWith('/seller/stats', {
      params: { from: undefined, to: undefined },
    })
  })
})

describe('sellerApi.orders', () => {
  it('передаёт фильтр и курсор в параметрах', async () => {
    const page = { items: [], nextCursor: 'cur_2', total: 41 }
    get.mockResolvedValueOnce({ data: page })

    const params = { status: 'confirmed', cursor: 'cur_1', limit: 20 }
    await expect(sellerApi.orders(params)).resolves.toEqual(page)
    expect(get).toHaveBeenCalledWith('/seller/orders', { params })
  })

  it('без параметров шлёт undefined', async () => {
    const page = { items: [], nextCursor: null, total: 0 }
    get.mockResolvedValueOnce({ data: page })

    await sellerApi.orders()

    expect(get).toHaveBeenCalledWith('/seller/orders', { params: undefined })
  })
})

describe('sellerApi.updateOrderStatus', () => {
  it('меняет статус и трек-номер заказа', async () => {
    const order = { id: 'ord_1', status: 'shipped' }
    patch.mockResolvedValueOnce({ data: order })

    await expect(sellerApi.updateOrderStatus('ord_1', 'shipped', 'TRK-1')).resolves.toEqual(order)
    expect(patch).toHaveBeenCalledWith('/seller/orders/ord_1/status', {
      status: 'shipped',
      trackingNumber: 'TRK-1',
    })
  })

  it('без трека шлёт только статус', async () => {
    const order = { id: 'ord_1', status: 'assembling' }
    patch.mockResolvedValueOnce({ data: order })

    await sellerApi.updateOrderStatus('ord_1', 'assembling')

    expect(patch).toHaveBeenCalledWith('/seller/orders/ord_1/status', {
      status: 'assembling',
      trackingNumber: undefined,
    })
  })
})

describe('sellerApi.cancelOrder', () => {
  it('отменяет заказ с причиной', async () => {
    const order = { id: 'ord_1', status: 'cancelled' }
    post.mockResolvedValueOnce({ data: order })

    await expect(sellerApi.cancelOrder('ord_1', 'Нет в наличии')).resolves.toEqual(order)
    expect(post).toHaveBeenCalledWith('/seller/orders/ord_1/cancel', { reason: 'Нет в наличии' })
  })
})

describe('sellerApi.dialogs', () => {
  it('возвращает диалоги по заказам', async () => {
    const dialogs = [
      {
        orderId: 'ord_1',
        counterpartName: 'Ирина',
        lastMessage: null,
        unreadCount: 2,
      },
    ]
    get.mockResolvedValueOnce({ data: dialogs })

    await expect(sellerApi.dialogs()).resolves.toEqual(dialogs)
    expect(get).toHaveBeenCalledWith('/messages/dialogs')
  })
})

describe('sellerApi.messages', () => {
  it('возвращает переписку по заказу', async () => {
    const messages = [{ id: 'msg_1', text: 'Здравствуйте', senderId: 'usr_1', createdAt: '2026-11-02T00:00:00.000Z' }]
    get.mockResolvedValueOnce({ data: messages })

    await expect(sellerApi.messages('ord_1')).resolves.toEqual(messages)
    expect(get).toHaveBeenCalledWith('/orders/ord_1/messages')
  })
})

describe('sellerApi.sendMessage', () => {
  it('отправляет сообщение по заказу', async () => {
    const message = { id: 'msg_2', text: 'Готово к отправке', senderId: 'usr_2', createdAt: '2026-11-03T00:00:00.000Z' }
    post.mockResolvedValueOnce({ data: message })

    await expect(sellerApi.sendMessage('ord_1', 'Готово к отправке')).resolves.toEqual(message)
    expect(post).toHaveBeenCalledWith('/orders/ord_1/messages', { text: 'Готово к отправке' })
  })
})

describe('sellerApi.markRead', () => {
  it('помечает переписку прочитанной без тела', async () => {
    post.mockResolvedValueOnce({ data: null })

    await expect(sellerApi.markRead('ord_1')).resolves.toBeUndefined()
    expect(post).toHaveBeenCalledWith('/orders/ord_1/messages/read')
  })
})
