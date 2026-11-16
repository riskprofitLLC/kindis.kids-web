// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { EmptyState } from '@/shared/ui/empty-state/empty-state'

afterEach(cleanup)

describe('EmptyState', () => {
  it('рисует заголовок и описание', () => {
    render(
      <EmptyState
        kind="basket"
        title="Ничего не найдено"
        description="Попробуйте убрать часть фильтров"
      />,
    )

    expect(screen.getByText('Ничего не найдено')).toBeTruthy()
    expect(screen.getByText('Попробуйте убрать часть фильтров')).toBeTruthy()
  })

  it('рисует кнопку действия и вызывает её по клику', () => {
    const onClick = vi.fn()
    render(
      <EmptyState
        kind="search"
        title="Пусто"
        action={
          <button type="button" onClick={onClick}>
            Сбросить фильтры
          </button>
        }
      />,
    )

    screen.getByRole('button', { name: 'Сбросить фильтры' }).click()

    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('все виды иллюстраций рендерятся без падения', () => {
    for (const kind of ['basket', 'search', 'heart', 'box'] as const) {
      const { unmount } = render(<EmptyState kind={kind} title={`Пусто ${kind}`} />)
      expect(screen.getByText(`Пусто ${kind}`)).toBeTruthy()
      unmount()
    }
  })

  it('собственный className дополняет обёртку', () => {
    render(<EmptyState kind="box" title="Пусто" className="my-8" />)

    const wrapper = screen.getByText('Пусто').closest('div')
    expect(wrapper?.className).toContain('my-8')
  })
})