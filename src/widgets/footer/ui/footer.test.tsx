// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it } from 'vitest'

import { Footer } from '@/widgets/footer/ui/footer'

afterEach(cleanup)

describe('Footer', () => {
  it('ведёт в каталог, на согласие и на новые страницы', () => {
    render(
      <MemoryRouter>
        <Footer />
      </MemoryRouter>,
    )

    const nav = screen.getByRole('navigation', { name: 'Подвал' })
    expect(nav).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Каталог' }).getAttribute('href')).toBe('/catalog')
    expect(
      screen.getByRole('link', { name: 'Согласие на обработку данных' }).getAttribute('href'),
    ).toBe('/consent')
    expect(screen.getByRole('link', { name: 'Помощь' }).getAttribute('href')).toBe('/help')
    expect(screen.getByRole('link', { name: 'О проекте' }).getAttribute('href')).toBe('/about')
    expect(screen.getByRole('link', { name: 'Для бизнеса' }).getAttribute('href')).toBe(
      '/for-business',
    )
  })

  it('показывает копирайт проекта', () => {
    render(
      <MemoryRouter>
        <Footer />
      </MemoryRouter>,
    )

    expect(screen.getByText('© kindis.kids')).toBeTruthy()
  })
})
