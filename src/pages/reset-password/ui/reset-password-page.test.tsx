// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({ resetPassword: vi.fn() }))

vi.mock('@/shared/api/auth-api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/shared/api/auth-api')>()
  return { ...actual, authApi: { ...actual.authApi, resetPassword: mocks.resetPassword } }
})

import ResetPasswordPage from '@/pages/reset-password/ui/reset-password-page'

let client: QueryClient

beforeEach(() => {
  client = new QueryClient({ defaultOptions: { mutations: { retry: false } } })
  vi.clearAllMocks()
})

afterEach(cleanup)

function CurrentPath() {
  return <p data-testid="path">{useLocation().pathname}</p>
}

function renderPage(state?: unknown) {
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[{ pathname: '/reset-password', state }]}>
        <Routes>
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="*" element={<CurrentPath />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('ResetPasswordPage', () => {
  it('подставляет email из состояния и требует совпадения паролей', async () => {
    const user = userEvent.setup()
    renderPage({ email: 'parent@example.com' })

    expect((screen.getByLabelText('Email') as HTMLInputElement).value).toBe('parent@example.com')

    await user.type(screen.getByLabelText('Код из письма'), '123456')
    await user.type(screen.getByLabelText('Новый пароль'), 'password123')
    await user.type(screen.getByLabelText('Повторите новый пароль'), 'password124')
    await user.click(screen.getByRole('button', { name: 'Сохранить пароль' }))

    expect(await screen.findByText('Пароли не совпадают')).toBeTruthy()
    expect(mocks.resetPassword).not.toHaveBeenCalled()
  })

  it('после смены пароля показывает экран успеха и ведёт ко входу', async () => {
    const user = userEvent.setup()
    mocks.resetPassword.mockResolvedValue(undefined)

    renderPage()

    await user.type(screen.getByLabelText('Email'), 'parent@example.com')
    await user.type(screen.getByLabelText('Код из письма'), '123456')
    await user.type(screen.getByLabelText('Новый пароль'), 'password123')
    await user.type(screen.getByLabelText('Повторите новый пароль'), 'password123')
    await user.click(screen.getByRole('button', { name: 'Сохранить пароль' }))

    await waitFor(() =>
      expect(mocks.resetPassword).toHaveBeenCalledWith(
        'parent@example.com',
        '123456',
        'password123',
      ),
    )
    expect(await screen.findByText('Пароль изменён')).toBeTruthy()

    await user.click(screen.getByRole('button', { name: 'Перейти к входу' }))
    await waitFor(() => expect(screen.getByTestId('path').textContent).toBe('/login'))
  })

  it('ошибку сброса показывает алертом', async () => {
    const user = userEvent.setup()
    mocks.resetPassword.mockRejectedValue(new Error('Код неверный'))

    renderPage()

    await user.type(screen.getByLabelText('Email'), 'parent@example.com')
    await user.type(screen.getByLabelText('Код из письма'), '123456')
    await user.type(screen.getByLabelText('Новый пароль'), 'password123')
    await user.type(screen.getByLabelText('Повторите новый пароль'), 'password123')
    await user.click(screen.getByRole('button', { name: 'Сохранить пароль' }))

    await waitFor(() => expect(screen.getByRole('alert')).toBeTruthy())
    expect(screen.getByText('Код неверный')).toBeTruthy()
  })
})
