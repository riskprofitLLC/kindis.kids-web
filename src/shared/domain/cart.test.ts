import { describe, expect, it } from 'vitest'

import {
  calculateTotals,
  type CartItem,
  deliveryCost,
  findStockConflicts,
} from '@/shared/domain/cart'

function item(overrides: Partial<CartItem> = {}): CartItem {
  return {
    id: 'i-1',
    productId: 'p-1',
    title: 'Поделка',
    priceKopecks: 35_000,
    quantity: 1,
    stock: 3,
    ...overrides,
  }
}

describe('calculateTotals', () => {
  it('считает количество и сумму в копейках', () => {
    const totals = calculateTotals([
      item({ id: 'a', quantity: 2 }),
      item({ id: 'b', priceKopecks: 15_000, quantity: 1 }),
    ])

    expect(totals).toEqual({ count: 3, totalKopecks: 85_000 })
  })

  it('пустая корзина даёт нули', () => {
    expect(calculateTotals([])).toEqual({ count: 0, totalKopecks: 0 })
  })
})

describe('deliveryCost', () => {
  it('самовывоз и договорённость бесплатны', () => {
    expect(deliveryCost('pickup')).toBe(0)
    expect(deliveryCost('seller_arrangement')).toBe(0)
  })

  it('почта — заглушная стоимость', () => {
    expect(deliveryCost('post')).toBeGreaterThan(0)
  })
})

describe('findStockConflicts', () => {
  it('не находит конфликтов при достатке остатка', () => {
    expect(findStockConflicts([item({ quantity: 3, stock: 3 })])).toEqual([])
  })

  it('находит позиции сверх остатка', () => {
    const conflicts = findStockConflicts([
      item({ id: 'a', productId: 'p-a', title: 'Шар', quantity: 4, stock: 2 }),
      item({ id: 'b', productId: 'p-b', quantity: 1, stock: 5 }),
    ])

    expect(conflicts).toEqual([
      { productId: 'p-a', title: 'Шар', requested: 4, available: 2 },
    ])
  })
})
