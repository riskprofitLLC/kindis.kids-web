// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({ register: vi.fn() }))

vi.mock('@/shared/api/auth-api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/shared/api/auth-api')>()
  return { ...actual, authApi: { ...actual.authApi, register: mocks.register } }
})

import RegisterPage from '@/pages/register/ui/register-page'

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
      <MemoryRouter initialEntries={['/register']}>
        <Routes>
          <Route path="/register" element={<RegisterPage />} />
          <Route path="*" element={<CurrentPath />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('RegisterPage', () => {
  it('показывает поля регистрации и ссылку на вход', () => {
    renderPage()

    expect(screen.getByLabelText('Как вас зовут')).toBeTruthy()
    expect(screen.getByLabelText('Email')).toBeTruthy()
    expect(screen.getByLabelText('Пароль')).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Войти' })).toBeTruthy()
  })

  it('проверяет длину имени и пароля', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.type(screen.getByLabelText('Как вас зовут'), 'Я')
    await user.type(screen.getByLabelText('Email'), 'parent@example.com')
    await user.type(screen.getByLabelText('Пароль'), 'short')
    await user.click(screen.getByRole('button', { name: 'Зарегистрироваться' }))

    expect(await screen.findByText('Имя должно быть не короче 2 символов')).toBeTruthy()
    expect(screen.getByText('Пароль должен быть не короче 8 символов')).toBeTruthy()
    expect(mocks.register).not.toHaveBeenCalled()
  })

  it('успешная регистрация ведёт на подтверждение email', async () => {
    const user = userEvent.setup()
    mocks.register.mockResolvedValue({ id: 'u-1' })

    renderPage()

    await user.type(screen.getByLabelText('Как вас зовут'), 'Мария Иванова')
    await user.type(screen.getByLabelText('Email'), 'parent@example.com')
    await user.type(screen.getByLabelText('Пароль'), 'password123')
    await user.click(screen.getByRole('button', { name: 'Зарегистрироваться' }))

    await waitFor(() =>
      expect(mocks.register).toHaveBeenCalledWith({
        fullName: 'Мария Иванова',
        email: 'parent@example.com',
        password: 'password123',
      }),
    )
    await waitFor(() => expect(screen.getByTestId('path').textContent).toBe('/verify-email'))
  })

  it('ошибку регистрации показывает алертом', async () => {
    const user = userEvent.setup()
    mocks.register.mockRejectedValue(new Error('Email уже занят'))

    renderPage()

    await user.type(screen.getByLabelText('Как вас зовут'), 'Мария Иванова')
    await user.type(screen.getByLabelText('Email'), 'parent@example.com')
    await user.type(screen.getByLabelText('Пароль'), 'password123')
    await user.click(screen.getByRole('button', { name: 'Зарегистрироваться' }))

    await waitFor(() => expect(screen.getByRole('alert')).toBeTruthy())
    expect(screen.getByText('Email уже занят')).toBeTruthy()
  })
})
