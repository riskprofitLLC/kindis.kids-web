// Форматирование для UI: цены в копейках и даты. Без DOM — переиспользуемо в RN.

const priceFormatter = new Intl.NumberFormat('ru-RU', {
  style: 'currency',
  currency: 'RUB',
  maximumFractionDigits: 0,
})

// Копейки → «1 200 ₽». Intl копейки не показывает, поэтому делим на 100.
export function formatPrice(kopecks: number): string {
  return priceFormatter.format(kopecks / 100)
}

export function formatDate(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat('ru-RU', { dateStyle: 'long' }).format(date)
}

// Подсветка искомого фрагмента в тексте результата.
export interface HighlightPart {
  text: string
  match: boolean
}

export function highlightParts(text: string, query: string): HighlightPart[] {
  const needle = query.trim().toLowerCase()
  if (!needle) return [{ text, match: false }]

  const parts: HighlightPart[] = []
  const lower = text.toLowerCase()
  let cursor = 0
  let index = lower.indexOf(needle, cursor)

  while (index !== -1) {
    if (index > cursor) parts.push({ text: text.slice(cursor, index), match: false })
    parts.push({ text: text.slice(index, index + needle.length), match: true })
    cursor = index + needle.length
    index = lower.indexOf(needle, cursor)
  }

  if (cursor < text.length) parts.push({ text: text.slice(cursor), match: false })

  return parts.length > 0 ? parts : [{ text, match: false }]
}
