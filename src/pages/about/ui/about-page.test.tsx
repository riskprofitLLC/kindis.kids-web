// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it } from 'vitest'

import AboutPage from '@/pages/about/ui/about-page'

afterEach(cleanup)

describe('AboutPage', () => {
  it('показывает описание проекта с пометкой о проверке', () => {
    render(
      <MemoryRouter>
        <AboutPage />
      </MemoryRouter>,
    )

    expect(screen.getByRole('heading', { level: 1, name: 'О проекте' })).toBeTruthy()
    expect(screen.getByText('Требует проверки')).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Перейти в каталог' }).getAttribute('href')).toBe(
      '/catalog',
    )
  })
})