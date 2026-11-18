// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'

import { buildPopupContent } from '@/features/map/lib/popup-content'
import type { ProductCard } from '@/shared/api/catalog-api'

const item = (title: string): ProductCard =>
  ({
    id: `p-${title}`,
    title,
    priceKopecks: 150000,
    childProfile: { city: 'Москва' },
  }) as ProductCard

describe('buildPopupContent', () => {
  it('показывает город，счётчик и до трёх поделок с ценой', () => {
    const root = buildPopupContent('Москва', [item('Кукла'), item('Матрёшка')])

    expect(root.textContent).toContain('Москва')
    expect(root.textContent).toContain('Поделок: 2')
    expect(root.textContent).toContain('Кукла')
    expect(root.textContent).toContain('Матрёшка')
  })

  it('больше трёх поделок в попап не попадают', () => {
    const root = buildPopupContent('Сочи', [item('a'), item('b'), item('c'), item('d')])

    expect(root.textContent).toContain('Поделок: 4')
    expect(root.textContent).not.toContain('d')
  })

  it('<img src=x onerror=...> остаётся текстом，а не элементом', () => {
    const root = buildPopupContent('<img src=x onerror="alert(1)">', [
      item('<img src=x onerror="alert(2)">'),
    ])

    expect(root.querySelectorAll('img')).toHaveLength(0)
    expect(root.querySelectorAll('strong')).toHaveLength(1)
    expect(root.textContent).toContain('<img src=x onerror="alert(1)">')
  })
})