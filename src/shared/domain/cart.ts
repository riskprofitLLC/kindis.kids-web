// Чистые правила корзины (без React и DOM) — тестируются и переиспользуются в RN.
// Цены — в копейках，как на бэкенде.

export interface CartItem {
  id: string
  productId: string
  title: string
  priceKopecks: number
  quantity: number
  // Остаток товара на момент чтения корзины — для проверки конфликтов.
  stock: number
}

export interface CartTotals {
  count: number
  totalKopecks: number
}

export function calculateTotals(items: CartItem[]): CartTotals {
  return items.reduce<CartTotals>(
    (acc, item) => ({
      count: acc.count + item.quantity,
      totalKopecks: acc.totalKopecks + item.priceKopecks * item.quantity,
    }),
    { count: 0, totalKopecks: 0 },
  )
}

// ---------- Доставка ----------

export const DELIVERY_METHODS = ['pickup', 'seller_arrangement', 'post'] as const
export type DeliveryMethod = (typeof DELIVERY_METHODS)[number]

export const DELIVERY_LABELS: Record<DeliveryMethod, string> = {
  pickup: 'Самовывоз',
  seller_arrangement: 'Договорённость с продавцом',
  post: 'Почта России',
}

// Стоимость доставки — заглушка до интеграции с платёжным этапом.
const DELIVERY_COST_KOPECKS: Record<DeliveryMethod, number> = {
  pickup: 0,
  seller_arrangement: 0,
  post: 30_000,
}

export function deliveryCost(method: DeliveryMethod): number {
  return DELIVERY_COST_KOPECKS[method]
}

// ---------- Проверка остатков ----------

export interface StockConflict {
  productId: string
  title: string
  requested: number
  available: number
}

// Позиции，которые не пройдут по остатку：показываем до оформления，
// чтобы покупатель не упёрся в ошибку на последнем шаге.
export function findStockConflicts(items: CartItem[]): StockConflict[] {
  return items
    .filter((item) => item.stock < item.quantity)
    .map((item) => ({
      productId: item.productId,
      title: item.title,
      requested: item.quantity,
      available: item.stock,
    }))
}
