// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { EmptyState } from '@/shared/ui/empty-state/empty-state'

describe('EmptyState', () => {
  it('рисует сердечко валидным path без заглушек', () => {
    const { container } = render(<EmptyState kind="heart" title="Пусто" />)

    const path = container.querySelector('path')
    expect(path).not.toBeNull()

    const d = path?.getAttribute('d') ?? ''
    expect(d).not.toContain('PLACEHOLDER')
    expect(d.startsWith('M')).toBe(true)
    // Сердечко собрано кубическими кривыми и замкнуто
    expect(d).toMatch(/[Cc]/)
    expect(d).toMatch(/[Zz]\s*$/)
  })

  it('показывает заголовок и следующий шаг', () => {
    render(<EmptyState kind="basket" title="Корзина пуста" description="Добавьте товары" />)

    expect(screen.getByRole('heading', { name: 'Корзина пуста' })).toBeTruthy()
    expect(screen.getByText('Добавьте товары')).toBeTruthy()
  })
})