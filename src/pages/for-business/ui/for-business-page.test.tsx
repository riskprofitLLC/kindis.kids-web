// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it } from 'vitest'

import ForBusinessPage from '@/pages/for-business/ui/for-business-page'

afterEach(cleanup)

describe('ForBusinessPage', () => {
  it('показывает заглушку со ссылками на регистрацию и размещение', () => {
    render(
      <MemoryRouter>
        <ForBusinessPage />
      </MemoryRouter>,
    )

    expect(screen.getByRole('heading', { level: 1, name: 'Для бизнеса' })).toBeTruthy()
    expect(screen.getByText('Требует проверки')).toBeTruthy()
    expect(
      screen.getByRole('link', { name: 'Зарегистрироваться как продавец' }).getAttribute('href'),
    ).toBe('/register')
  })
})