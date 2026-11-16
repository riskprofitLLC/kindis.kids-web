// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({ login: vi.fn(), mergeWithSession: vi.fn() }))

vi.mock('@/shared/api/auth-api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/shared/api/auth-api')>()
  return { ...actual, authApi: { ...actual.authApi, login: mocks.login } }
})
vi.mock('@/shared/api/cart-api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/shared/api/cart-api')>()
  return {
    ...actual,
    cartApi: { ...actual.cartApi, mergeWithSession: mocks.mergeWithSession },
  }
})
vi.mock('@/shared/lib/guest-session', () => ({
  getGuestSessionId: () => 'guest-1',
  clearGuestSessionId: vi.fn(),
}))

import LoginPage from '@/pages/login/ui/login-page'

let client: QueryClient

beforeEach(() => {
  client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  vi.clearAllMocks()
})

afterEach(cleanup)

function CurrentPath() {
  return <p data-testid="path">{useLocation().pathname}</p>
}

function renderPage(state?: unknown) {
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[{ pathname: '/login', state }]}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="*" element={<CurrentPath />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('LoginPage', () => {
  it('показывает поля входа и ссылки восстановления и регистрации', () => {
    renderPage()

    expect(screen.getByLabelText('Email')).toBeTruthy()
    expect(screen.getByLabelText('Пароль')).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Забыли пароль?' })).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Зарегистрироваться' })).toBeTruthy()
  })

  it('проверяет поля до отправки', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(screen.getByRole('button', { name: 'Войти' }))

    expect(await screen.findByText('Введите корректный email')).toBeTruthy()
    expect(screen.getByText('Введите пароль')).toBeTruthy()
    expect(mocks.login).not.toHaveBeenCalled()
  })

  it('успешный вход ведёт в кабинет', async () => {
    const user = userEvent.setup()
    mocks.login.mockResolvedValue({ id: 'u-1', email: 'parent@example.com', role: 'parent' })
    mocks.mergeWithSession.mockResolvedValue(undefined)

    renderPage()

    await user.type(screen.getByLabelText('Email'), 'parent@example.com')
    await user.type(screen.getByLabelText('Пароль'), 'password123')
    await user.click(screen.getByRole('button', { name: 'Войти' }))

    await waitFor(() => expect(mocks.login).toHaveBeenCalledWith('parent@example.com', 'password123'))
    await waitFor(() => expect(screen.getByTestId('path').textContent).toBe('/cabinet'))
  })

  it('неподтверждённый email уводит на экран кода', async () => {
    const user = userEvent.setup()
    const { ApiError } = await import('@/shared/api/errors')
    mocks.login.mockRejectedValue(new ApiError('Почта не подтверждена', 403, 'AUTH_EMAIL_NOT_VERIFIED'))

    renderPage()

    await user.type(screen.getByLabelText('Email'), 'parent@example.com')
    await user.type(screen.getByLabelText('Пароль'), 'password123')
    await user.click(screen.getByRole('button', { name: 'Войти' }))

    await waitFor(() => expect(screen.getByTestId('path').textContent).toBe('/verify-email'))
  })

  it('прочую ошибку показывает алертом', async () => {
    const user = userEvent.setup()
    mocks.login.mockRejectedValue(new Error('Неверный пароль'))

    renderPage()

    await user.type(screen.getByLabelText('Email'), 'parent@example.com')
    await user.type(screen.getByLabelText('Пароль'), 'wrong')
    await user.click(screen.getByRole('button', { name: 'Войти' }))

    await waitFor(() => expect(screen.getByRole('alert')).toBeTruthy())
    expect(screen.getByText('Неверный пароль')).toBeTruthy()
  })
})
