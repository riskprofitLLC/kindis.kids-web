import { beforeEach, describe, expect, it, vi } from 'vitest'

// Заказы зовут GET/POST клиента — мокаем оба метода.
const get = vi.fn()
const post = vi.fn()

vi.mock('@/shared/api/client', () => ({
  api: {
    get: (...args: unknown[]) => get(...args),
    post: (...args: unknown[]) => post(...args),
  },
}))

const { ordersApi, ORDER_STATUS_LABELS, BUYER_CANCELABLE } = await import('@/shared/api/orders-api')

function order(overrides: Record<string, unknown> = {}) {
  return {
    id: 'ord_1',
    status: 'created',
    totalKopecks: 45000,
    deliveryMethod: 'courier',
    addressJson: null,
    comment: null,
    trackingNumber: null,
    cancelReason: null,
    createdAt: '2026-11-01T00:00:00.000Z',
    ...overrides,
  }
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('ordersApi.mine', () => {
  it('возвращает заказы покупателя с позициями', async () => {
    const items = [
      { id: 'itm_1', productId: 'prd_1', quantity: 2, priceKopecks: 45000, titleSnapshot: 'Шкатулка' },
    ]
    const list = [{ ...order(), items }]
    get.mockResolvedValueOnce({ data: list })

    await expect(ordersApi.mine()).resolves.toEqual(list)
    expect(get).toHaveBeenCalledWith('/orders')
  })
})

describe('ordersApi.byId', () => {
  it('возвращает один заказ по id', async () => {
    const detail = { ...order(), items: [] }
    get.mockResolvedValueOnce({ data: detail })

    await expect(ordersApi.byId('ord_1')).resolves.toEqual(detail)
    expect(get).toHaveBeenCalledWith('/orders/ord_1')
  })
})

describe('ordersApi.cancel', () => {
  it('шлёт причину отмены покупателем', async () => {
    const cancelled = order({ status: 'cancelled', cancelReason: 'Передумал' })
    post.mockResolvedValueOnce({ data: cancelled })

    await expect(ordersApi.cancel('ord_1', 'Передумал')).resolves.toEqual(cancelled)
    expect(post).toHaveBeenCalledWith('/orders/ord_1/cancel', { reason: 'Передумал' })
  })

  it('без причины шлёт пустое поле', async () => {
    const cancelled = order({ status: 'cancelled' })
    post.mockResolvedValueOnce({ data: cancelled })

    await ordersApi.cancel('ord_1')

    expect(post).toHaveBeenCalledWith('/orders/ord_1/cancel', { reason: undefined })
  })
})

describe('ordersApi.checkout', () => {
  it('оформляет заказ с ключом идемпотентности в параметрах', async () => {
    const created = order()
    post.mockResolvedValueOnce({ data: created })

    const input = { deliveryMethod: 'pickup' as const, address: { city: 'Казань' }, comment: 'Позвонить' }
    await expect(ordersApi.checkout(input, 'idem-key-1')).resolves.toEqual(created)
    expect(post).toHaveBeenCalledWith('/orders', input, { params: { idempotencyKey: 'idem-key-1' } })
  })
})

describe('ordersApi константы статусов', () => {
  it('подписи покрывают все статусы заказа', () => {
    expect(ORDER_STATUS_LABELS.created).toBe('Оформлен')
    expect(ORDER_STATUS_LABELS.delivered).toBe('Доставлен')
    expect(Object.keys(ORDER_STATUS_LABELS)).toHaveLength(6)
  })

  it('покупатель отменяет только созданный и подтверждённый заказ', () => {
    expect(BUYER_CANCELABLE).toEqual(['created', 'confirmed'])
  })
})
