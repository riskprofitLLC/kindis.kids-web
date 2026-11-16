// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({ forgotPassword: vi.fn() }))

vi.mock('@/shared/api/auth-api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/shared/api/auth-api')>()
  return { ...actual, authApi: { ...actual.authApi, forgotPassword: mocks.forgotPassword } }
})

import ForgotPasswordPage from '@/pages/forgot-password/ui/forgot-password-page'

let client: QueryClient

beforeEach(() => {
  client = new QueryClient({ defaultOptions: { mutations: { retry: false } } })
  vi.clearAllMocks()
})

afterEach(cleanup)

function CurrentPath() {
  return <p data-testid="path">{useLocation().pathname}</p>
}

function renderPage() {
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={['/forgot-password']}>
        <Routes>
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="*" element={<CurrentPath />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('ForgotPasswordPage', () => {
  it('проверяет формат email', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.type(screen.getByLabelText('Email'), 'not-email')
    await user.click(screen.getByRole('button', { name: 'Получить код' }))

    expect(await screen.findByText('Введите корректный email')).toBeTruthy()
    expect(mocks.forgotPassword).not.toHaveBeenCalled()
  })

  it('после отправки показывает экран «проверьте почту»', async () => {
    const user = userEvent.setup()
    mocks.forgotPassword.mockResolvedValue(undefined)

    renderPage()

    await user.type(screen.getByLabelText('Email'), 'parent@example.com')
    await user.click(screen.getByRole('button', { name: 'Получить код' }))

    await waitFor(() => expect(mocks.forgotPassword).toHaveBeenCalledWith('parent@example.com'))
    expect(await screen.findByText('Проверьте почту')).toBeTruthy()
    expect(screen.getByText(/код для сброса пароля уже отправлен/)).toBeTruthy()
  })

  it('кнопка «ввести код» ведёт на сброс пароля', async () => {
    const user = userEvent.setup()
    mocks.forgotPassword.mockResolvedValue(undefined)

    renderPage()

    await user.type(screen.getByLabelText('Email'), 'parent@example.com')
    await user.click(screen.getByRole('button', { name: 'Получить код' }))
    await user.click(await screen.findByRole('button', { name: 'Ввести код' }))

    await waitFor(() => expect(screen.getByTestId('path').textContent).toBe('/reset-password'))
  })

  it('ошибку отправки показывает алертом', async () => {
    const user = userEvent.setup()
    mocks.forgotPassword.mockRejectedValue(new Error('Слишком часто'))

    renderPage()

    await user.type(screen.getByLabelText('Email'), 'parent@example.com')
    await user.click(screen.getByRole('button', { name: 'Получить код' }))

    await waitFor(() => expect(screen.getByRole('alert')).toBeTruthy())
    expect(screen.getByText('Слишком часто')).toBeTruthy()
  })
})
