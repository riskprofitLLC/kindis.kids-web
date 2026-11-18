// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { ErrorBoundary } from '@/app/providers/error-boundary'

afterEach(cleanup)

function Boom(): never {
  throw new Error('Сломанный ребёнок')
}

describe('ErrorBoundary', () => {
  it('без ошибки рендерит детей как есть', () => {
    render(
      <ErrorBoundary>
        <p>Каталог поделок</p>
      </ErrorBoundary>,
    )

    expect(screen.getByText('Каталог поделок')).toBeTruthy()
  })

  it('ловит ошибку ребёнка и показывает понятный экран', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})

    render(
      <ErrorBoundary>
        <Boom />
      </ErrorBoundary>,
    )

    expect(screen.getByRole('alert')).toBeTruthy()
    expect(screen.getByText('Что-то сломалось')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Обновить страницу' })).toBeTruthy()

    consoleError.mockRestore()
  })
})
