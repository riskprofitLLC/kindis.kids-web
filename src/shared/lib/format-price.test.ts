import { describe, expect, it } from 'vitest'

import { formatDate, formatPrice, highlightParts } from '@/shared/lib/format'

describe('formatPrice', () => {
  it('копейки превращает в рубли с разделителями разрядов', () => {
    // Intl в Node использует неразрывные пробелы — нормализуем перед сравнением.
    const normalize = (value: string) => value.replace(/\s/g, ' ')
    expect(normalize(formatPrice(65000))).toBe('650 ₽')
    expect(normalize(formatPrice(1_234_500))).toBe('12 345 ₽')
  })

  it('ноль и мелочь форматируются без ошибок', () => {
    expect(formatPrice(0)).toContain('0')
    expect(formatPrice(1)).toContain('0')
  })

  it('не показывает копейки', () => {
    expect(formatPrice(65_099)).not.toContain(',')
    expect(formatPrice(65_099)).not.toMatch(/\.\d\d/)
  })
})

describe('formatDate', () => {
  it('валидную дату выводит по-русски', () => {
    const formatted = formatDate('2026-11-12T10:00:00.000Z').toLowerCase()
    expect(formatted).toContain('2026')
    expect(formatted).toContain('ноября')
  })

  it('мусор даёт пустую строку', () => {
    expect(formatDate('не дата')).toBe('')
    expect(formatDate('')).toBe('')
  })
})

describe('highlightParts', () => {
  it('пустой запрос не подсвечивает ничего', () => {
    expect(highlightParts('Бусы из глины', '   ')).toEqual([
      { text: 'Бусы из глины', match: false },
    ])
  })

  it('находит все вхождения без учёта регистра', () => {
    const parts = highlightParts('БУСЫ и бусы', 'бусы')
    const matched = parts.filter((part) => part.match)
    expect(matched).toHaveLength(2)
    expect(matched.map((part) => part.text)).toEqual(['БУСЫ', 'бусы'])
  })

  it('склеивает части обратно в исходный текст', () => {
    const text = 'Расписная шкатулка из дерева'
    const query = 'шкатулка'
    const restored = highlightParts(text, query)
      .map((part) => part.text)
      .join('')
    expect(restored).toBe(text)
  })

  it('запрос длиннее текста не ломает разбор', () => {
    const parts = highlightParts('шар', 'шкатулка из дерева')
    expect(parts).toEqual([{ text: 'шар', match: false }])
  })

  it('совпадение в начале и в конце текста', () => {
    const parts = highlightParts('шкатулка дома', 'шкатулка')
    expect(parts[0]).toEqual({ text: 'шкатулка', match: true })
    expect(parts.at(-1)).toEqual({ text: ' дома', match: false })
  })
})
