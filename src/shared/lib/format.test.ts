import { describe, expect, it } from 'vitest'

import { formatPrice, highlightParts } from '@/shared/lib/format'

describe('formatPrice', () => {
  it('копейки превращает в рубли без копеек', () => {
    // Intl выводит неразрывный пробел — сравниваем по вхождениям.
    expect(formatPrice(35000)).toContain('350')
    expect(formatPrice(35000)).toContain('₽')
  })

  it('округляет до рубля', () => {
    expect(formatPrice(35499)).toContain('355')
  })
})

describe('highlightParts', () => {
  it('без запроса возвращает один обычный фрагмент', () => {
    expect(highlightParts('Бусы из бисера', '')).toEqual([{ text: 'Бусы из бисера', match: false }])
  })

  it('находит совпадение в начале', () => {
    const parts = highlightParts('Бусы из бисера', 'бусы')
    expect(parts).toEqual([
      { text: 'Бусы', match: true },
      { text: ' из бисера', match: false },
    ])
  })

  it('находит несколько вхождений', () => {
    const parts = highlightParts('шар шар и шар', 'шар')
    expect(parts.filter((part) => part.match)).toHaveLength(3)
  })

  it('регистр не важен', () => {
    const parts = highlightParts('Открытка', 'откр')
    expect(parts[0]).toEqual({ text: 'Откр', match: true })
  })
})
