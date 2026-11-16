import { describe, expect, it } from 'vitest'

import { routes } from '@/shared/config/routes'

describe('routes', () => {
  it('статические пути уникальны', () => {
    const staticPaths = Object.entries(routes)
      .filter(([, value]) => typeof value === 'string')
      .map(([, value]) => value)

    expect(new Set(staticPaths).size).toBe(staticPaths.length)
  })

  it('товар и продавец адресуются по слагу', () => {
    expect(routes.product('shkatulka-iz-duba')).toBe('/product/shkatulka-iz-duba')
    expect(routes.seller('kolya-ivanov')).toBe('/seller/kolya-ivanov')
  })

  it('заказ в кабинете адресуется по id', () => {
    expect(routes.cabinetOrderDetail('o-1')).toBe('/cabinet/orders/o-1')
    expect(routes.cabinetProductEdit('p-1')).toBe('/cabinet/products/p-1/edit')
  })

  it('кабинетные пути лежат под /cabinet, админские — под /admin', () => {
    const cabinet = Object.entries(routes).filter(([key]) => key.startsWith('cabinet'))
    const admin = Object.entries(routes).filter(([key]) => key.startsWith('admin'))

    expect(cabinet.length).toBeGreaterThan(0)
    expect(admin.length).toBeGreaterThan(0)
    for (const [, value] of [...cabinet, ...admin]) {
      if (typeof value !== 'string') continue
      expect(value.startsWith('/cabinet') || value.startsWith('/admin')).toBe(true)
    }
  })
})