import { describe, expect, it } from 'vitest'

import {
  calculateTotals,
  type CartItem,
  DELIVERY_LABELS,
  DELIVERY_METHODS,
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

describe('DELIVERY_METHODS', () => {
  it('перечисляет все способы доставки в стабильном порядке', () => {
    expect(DELIVERY_METHODS).toEqual(['pickup', 'seller_arrangement', 'post'])
  })

  it('у каждого способа есть человекочитаемая подпись', () => {
    for (const method of DELIVERY_METHODS) {
      expect(DELIVERY_LABELS[method]).toBeTruthy()
    }
  })
})

describe('deliveryCost', () => {
  it('бесплатные способы стоят ноль', () => {
    expect(deliveryCost('pickup')).toBe(0)
    expect(deliveryCost('seller_arrangement')).toBe(0)
  })

  it('почта стоит фиксированно и дороже бесплатных', () => {
    const post = deliveryCost('post')
    expect(post).toBe(30_000)
    expect(post).toBeGreaterThan(deliveryCost('pickup'))
  })
})

describe('calculateTotals — краевые случаи', () => {
  it('нулевое количество ничего не добавляет к сумме', () => {
    const totals = calculateTotals([item({ quantity: 0 })])
    expect(totals).toEqual({ count: 0, totalKopecks: 0 })
  })

  it('дорогая позиция умножается на количество', () => {
    const totals = calculateTotals([item({ priceKopecks: 999_999, quantity: 3 })])
    expect(totals.totalKopecks).toBe(2_999_997)
    expect(totals.count).toBe(3)
  })

  it('не мутирует переданный массив', () => {
    const items = [item({ id: 'a' }), item({ id: 'b' })]
    const snapshot = JSON.stringify(items)
    calculateTotals(items)
    expect(JSON.stringify(items)).toBe(snapshot)
  })
})

describe('findStockConflicts — краевые случаи', () => {
  it('пустая корзина не даёт конфликтов', () => {
    expect(findStockConflicts([])).toEqual([])
  })

  it('ровно по остатку — не конфликт', () => {
    expect(findStockConflicts([item({ quantity: 5, stock: 5 })])).toEqual([])
  })

  it('нулевой остаток при любом количестве — конфликт', () => {
    const conflicts = findStockConflicts([item({ quantity: 1, stock: 0 })])
    expect(conflicts).toHaveLength(1)
    expect(conflicts[0]).toMatchObject({ requested: 1, available: 0 })
  })

  it('сохраняет порядок позиций и не трогает исходные объекты', () => {
    const source = item({ id: 'x', productId: 'p-x', title: 'Шар', quantity: 4, stock: 2 })
    const conflicts = findStockConflicts([source])
    expect(conflicts[0]).not.toBe(source)
    expect(source.quantity).toBe(4)
    expect(source.stock).toBe(2)
  })
})
