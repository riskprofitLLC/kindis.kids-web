import { afterEach, describe, expect, it } from 'vitest'

import { addRecent, clearRecent, listRecent } from '@/shared/lib/recently-viewed'
import { storage } from '@/shared/lib/storage/web-storage'

const KEY = 'kindis-recent-products'

afterEach(() => {
  clearRecent()
})

describe('addRecent', () => {
  it('сохраняет товар в хранилище под своим ключом', () => {
    addRecent({ id: 'p-1', title: 'Кукла' })

    expect(storage.getItem(KEY)).toContain('p-1')
    expect(listRecent()).toEqual([{ id: 'p-1', title: 'Кукла' }])
  })

  it('новый товар встаёт в начало списка', () => {
    addRecent({ id: 'p-1', title: 'Кукла' })
    addRecent({ id: 'p-2', title: 'Мягкая игрушка' })

    expect(listRecent().map((item) => item.id)).toEqual(['p-2', 'p-1'])
  })

  it('повторный просмотр не дублирует запись', () => {
    addRecent({ id: 'p-1', title: 'Кукла' })
    addRecent({ id: 'p-2', title: 'Мягкая игрушка' })
    addRecent({ id: 'p-1', title: 'Кукла' })

    expect(listRecent()).toEqual([
      { id: 'p-1', title: 'Кукла' },
      { id: 'p-2', title: 'Мягкая игрушка' },
    ])
  })

  it('повторный просмотр обновляет название', () => {
    addRecent({ id: 'p-1', title: 'Кукла' })
    addRecent({ id: 'p-1', title: 'Кукла тряпичная' })

    expect(listRecent()).toEqual([{ id: 'p-1', title: 'Кукла тряпичная' }])
  })

  it('держит не больше восьми записей, отбрасывая самые старые', () => {
    for (let index = 0; index < 10; index += 1) {
      addRecent({ id: `p-${index}`, title: `Товар ${index}` })
    }

    const items = listRecent()

    expect(items).toHaveLength(8)
    expect(items[0].id).toBe('p-9')
    expect(items.at(-1)?.id).toBe('p-2')
  })

  it('игнорирует товар без идентификатора', () => {
    addRecent({ id: '', title: 'Без идентификатора' })

    expect(listRecent()).toEqual([])
  })
})

describe('listRecent', () => {
  it('на пустом хранилище отдаёт пустой список', () => {
    expect(listRecent()).toEqual([])
  })

  it('битый JSON не роняет чтение', () => {
    storage.setItem(KEY, '{не json')

    expect(listRecent()).toEqual([])
  })

  it('некорректные записи отбрасываются', () => {
    storage.setItem(KEY, JSON.stringify([{ id: 'p-1' }, null, { id: '', title: '' }, 'кукла']))

    expect(listRecent()).toEqual([])
  })
})

describe('clearRecent', () => {
  it('очищает список и хранилище', () => {
    addRecent({ id: 'p-1', title: 'Кукла' })

    clearRecent()

    expect(listRecent()).toEqual([])
    expect(storage.getItem(KEY)).toBeNull()
  })
})