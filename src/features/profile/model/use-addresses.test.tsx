// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'

import { useAddresses } from '@/features/profile/model/use-addresses'
import { storage } from '@/shared/lib/storage/web-storage'

const KEY = 'kindis-addresses'

const input = {
  label: 'Дом',
  city: 'Москва',
  street: 'Тверская',
  house: '1',
  apartment: '10',
  zip: '125009',
}

beforeEach(() => {
  storage.removeItem(KEY)
})

describe('useAddresses', () => {
  it('стартует пустым списком', () => {
    const { result } = renderHook(() => useAddresses())

    expect(result.current.items).toEqual([])
  })

  it('добавление адреса пишет его в хранилище', () => {
    const { result } = renderHook(() => useAddresses())

    act(() => result.current.add(input))

    expect(result.current.items).toHaveLength(1)
    expect(result.current.items[0]).toMatchObject({ ...input, id: expect.stringMatching(/^addr-/) })
    // Переживает «перезагрузку» — читается из localStorage.
    expect(JSON.parse(storage.getItem(KEY) ?? '[]')).toHaveLength(1)
  })

  it('удаление убирает только свой адрес', () => {
    const { result } = renderHook(() => useAddresses())

    act(() => result.current.add(input))
    act(() => result.current.add({ ...input, label: 'Дача' }))

    const [first] = result.current.items
    act(() => result.current.remove(first.id))

    expect(result.current.items).toHaveLength(1)
    expect(result.current.items[0].label).toBe('Дача')
  })

  it('битая запись в хранилище не роняет хук', () => {
    storage.setItem(KEY, '{не json')

    const { result } = renderHook(() => useAddresses())

    expect(result.current.items).toEqual([])
  })
})