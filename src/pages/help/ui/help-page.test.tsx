// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it } from 'vitest'

import HelpPage from '@/pages/help/ui/help-page'

afterEach(cleanup)

describe('HelpPage', () => {
  it('показывает FAQ с пометкой о проверке', () => {
    render(
      <MemoryRouter>
        <HelpPage />
      </MemoryRouter>,
    )

    expect(screen.getByRole('heading', { level: 1, name: 'Помощь' })).toBeTruthy()
    expect(screen.getByText('Требует проверки')).toBeTruthy()
    expect(screen.getByRole('heading', { name: 'Как оформить заказ?' })).toBeTruthy()
  })
})