import { describe, expect, it } from 'vitest'

import {
  type CatalogState,
  DEFAULT_SORT,
  parseCatalogState,
  serializeCatalogState,
} from '@/shared/domain/catalog'

describe('parseCatalogState', () => {
  it('пустой record даёт сортировку по умолчанию', () => {
    expect(parseCatalogState({})).toEqual({ filters: {}, sort: DEFAULT_SORT })
  })

  it('неизвестная сортировка откатывается на дефолтную', () => {
    expect(parseCatalogState({ sort: 'nonsense' }).sort).toBe('newest')
  })

  it('читает запрос и категорию', () => {
    const state = parseCatalogState({ q: 'бусы', cat: 'ukrasheniya' })
    expect(state.filters.query).toBe('бусы')
    expect(state.filters.categorySlug).toBe('ukrasheniya')
  })

  it('цену переводит из рублей в копейки', () => {
    const state = parseCatalogState({ pmin: '100', pmax: '2500' })
    expect(state.filters.priceFromKopecks).toBe(10_000)
    expect(state.filters.priceToKopecks).toBe(250_000)
  })

  it('игнорирует неположительную цену', () => {
    const state = parseCatalogState({ pmin: '0', pmax: '-5' })
    expect(state.filters.priceFromKopecks).toBeUndefined()
    expect(state.filters.priceToKopecks).toBeUndefined()
  })

  it('читает флаги наличия и приоритета', () => {
    const state = parseCatalogState({ stock: '1', prio: '1' })
    expect(state.filters.inStockOnly).toBe(true)
    expect(state.filters.priorityOnly).toBe(true)
  })

  it('возрастную группу раскрывает в границы бакета', () => {
    const state = parseCatalogState({ age: '2' })
    expect(state.filters.ageFrom).toBe(7)
    expect(state.filters.ageTo).toBe(10)
  })

  it('несуществующий номер бакета не ломает разбор', () => {
    const state = parseCatalogState({ age: '99' })
    expect(state.filters.ageFrom).toBeUndefined()
    expect(state.filters.ageTo).toBeUndefined()
  })

  it('читает город продавца', () => {
    expect(parseCatalogState({ city: 'Казань' }).filters.city).toBe('Казань')
  })
})

describe('serializeCatalogState', () => {
  it('round-trip сохраняет все фильтры', () => {
    const state: CatalogState = {
      filters: {
        query: 'ёлочная игрушка',
        categorySlug: 'novy-god',
        priceFromKopecks: 50_000,
        priceToKopecks: 150_000,
        inStockOnly: true,
        priorityOnly: true,
        ageFrom: null,
        ageTo: null,
        city: 'Санкт-Петербург',
      },
      sort: 'price_asc',
    }

    const record = serializeCatalogState(state)

    expect(record.q).toBe('ёлочная игрушка')
    expect(record.cat).toBe('novy-god')
    // Цена в URL — в рублях.
    expect(record.pmin).toBe('500')
    expect(record.pmax).toBe('1500')
    expect(record.stock).toBe('1')
    expect(record.prio).toBe('1')
    expect(record.city).toBe('Санкт-Петербург')
    expect(record.sort).toBe('price_asc')

    const reparsed = parseCatalogState(record)
    expect(reparsed.filters.query).toBe(state.filters.query)
    expect(reparsed.filters.categorySlug).toBe(state.filters.categorySlug)
    expect(reparsed.filters.priceFromKopecks).toBe(state.filters.priceFromKopecks)
    expect(reparsed.filters.priceToKopecks).toBe(state.filters.priceToKopecks)
    expect(reparsed.filters.inStockOnly).toBe(true)
    expect(reparsed.filters.priorityOnly).toBe(true)
    expect(reparsed.filters.city).toBe(state.filters.city)
    expect(reparsed.sort).toBe('price_asc')
  })

  it('возрастная группа переживает round-trip', () => {
    const record = serializeCatalogState({
      filters: { ageFrom: 11, ageTo: null },
      sort: DEFAULT_SORT,
    })

    expect(record.age).toBe('3')

    const reparsed = parseCatalogState(record)
    expect(reparsed.filters.ageFrom).toBe(11)
    expect(reparsed.filters.ageTo).toBeNull()
  })

  it('дефолтная сортировка не попадает в URL', () => {
    const record = serializeCatalogState({ filters: {}, sort: DEFAULT_SORT })
    expect(record.sort).toBeUndefined()
  })
})
