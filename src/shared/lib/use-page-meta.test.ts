// @vitest-environment jsdom
import { renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { usePageMeta } from '@/shared/lib/use-page-meta'

const meta = (selector: string) =>
  document.head.querySelector<HTMLMetaElement>(selector)

const allMeta = (selector: string) =>
  Array.from(document.head.querySelectorAll<HTMLMetaElement>(selector))

afterEach(() => {
  document.title = ''
  for (const el of document.head.querySelectorAll('meta')) el.remove()
})

describe('usePageMeta', () => {
  it('выставляет document.title', () => {
    renderHook(() => usePageMeta({ title: 'Корзина' }))
    expect(document.title).toBe('Корзина')
  })

  it('создаёт meta description', () => {
    renderHook(() => usePageMeta({ description: 'Детские handmade-вещи' }))
    const el = meta('meta[name="description"]')
    expect(el?.getAttribute('content')).toBe('Детские handmade-вещи')
  })

  it('robots noindex при noindex=true', () => {
    renderHook(() => usePageMeta({ noindex: true }))
    expect(meta('meta[name="robots"]')?.getAttribute('content')).toBe(
      'noindex, nofollow',
    )
  })

  it('robots index, follow по умолчанию', () => {
    renderHook(() => usePageMeta({}))
    expect(meta('meta[name="robots"]')?.getAttribute('content')).toBe(
      'index, follow',
    )
  })

  it('og:image создаётся только при переданной картинке', () => {
    renderHook(() => usePageMeta({ title: 'Товар' }))
    expect(meta('meta[property="og:image"]')).toBeNull()

    renderHook(() =>
      usePageMeta({ title: 'Товар', image: 'https://cdn.test/p.jpg' }),
    )
    expect(meta('meta[property="og:image"]')?.getAttribute('content')).toBe(
      'https://cdn.test/p.jpg',
    )
  })

  it('og:title и og:description следуют за title и description', () => {
    renderHook(() =>
      usePageMeta({ title: 'Игрушки', description: 'Ручная работа' }),
    )
    expect(meta('meta[property="og:title"]')?.getAttribute('content')).toBe(
      'Игрушки',
    )
    expect(meta('meta[property="og:description"]')?.getAttribute('content')).toBe(
      'Ручная работа',
    )
  })

  it('повторный вызов обновляет меты, а не дублирует их', () => {
    const { rerender } = renderHook((props) => usePageMeta(props), {
      initialProps: { title: 'Раз', description: 'Один' },
    })
    rerender({ title: 'Два', description: 'Два' })

    expect(document.title).toBe('Два')
    expect(allMeta('meta[name="description"]')).toHaveLength(1)
    expect(allMeta('meta[name="robots"]')).toHaveLength(1)
    expect(allMeta('meta[property="og:title"]')).toHaveLength(1)
    expect(allMeta('meta[property="og:description"]')).toHaveLength(1)
    expect(meta('meta[name="description"]')?.getAttribute('content')).toBe(
      'Два',
    )
  })

  it('размонтирование убирает созданные меты и откатывает чужие', () => {
    const own = document.createElement('meta')
    own.setAttribute('name', 'description')
    own.setAttribute('content', 'было')
    document.head.appendChild(own)

    const { unmount } = renderHook(() =>
      usePageMeta({ title: 'Страница', description: 'стало' }),
    )
    unmount()

    expect(own.getAttribute('content')).toBe('было')
    expect(allMeta('meta[name="robots"]')).toHaveLength(0)
  })
})