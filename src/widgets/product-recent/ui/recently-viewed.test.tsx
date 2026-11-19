// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it } from 'vitest'

import { addRecent, clearRecent } from '@/shared/lib/recently-viewed'
import { RecentlyViewed } from '@/widgets/product-recent/ui/recently-viewed'

afterEach(() => {
  clearRecent()
  cleanup()
})

function renderWidget() {
  return render(
    <MemoryRouter>
      <RecentlyViewed />
    </MemoryRouter>,
  )
}

describe('RecentlyViewed', () => {
  it('на пустом списке ничего не рендерит', () => {
    const { container } = renderWidget()

    expect(container.childNodes).toHaveLength(0)
  })

  it('показывает ссылки на просмотренные товары', () => {
    addRecent({ id: 'p-1', title: 'Кукла' })
    addRecent({ id: 'p-2', title: 'Мягкая игрушка' })

    renderWidget()

    const links = screen.getAllByRole('link')

    expect(links).toHaveLength(2)
    // Последний просмотр — первый в списке.
    expect(links[0].textContent).toBe('Мягкая игрушка')
    expect(links[0].getAttribute('href')).toBe('/product/p-2')
    expect(links[1].getAttribute('href')).toBe('/product/p-1')
  })

  it('навигация подписана для скринридера', () => {
    addRecent({ id: 'p-1', title: 'Кукла' })

    renderWidget()

    const nav = screen.getByRole('navigation')

    expect(nav.getAttribute('aria-label')).toBe('Недавно смотрели')
  })

  it('ссылки — тач-таргеты не меньше 44px по высоте', () => {
    addRecent({ id: 'p-1', title: 'Кукла' })

    renderWidget()

    const link = screen.getByRole('link')

    expect(link.className).toContain('min-h-11')
  })
})