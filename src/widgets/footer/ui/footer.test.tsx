// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it } from 'vitest'

import { Footer } from '@/widgets/footer/ui/footer'

afterEach(cleanup)

describe('Footer', () => {
  it('ведёт в каталог и на страницу согласия', () => {
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
