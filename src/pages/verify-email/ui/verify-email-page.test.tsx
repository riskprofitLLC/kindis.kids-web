// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({ verifyEmail: vi.fn(), mergeWithSession: vi.fn() }))

vi.mock('@/shared/api/auth-api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/shared/api/auth-api')>()
  return { ...actual, authApi: { ...actual.authApi, verifyEmail: mocks.verifyEmail } }
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

import VerifyEmailPage from '@/pages/verify-email/ui/verify-email-page'

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
      <MemoryRouter initialEntries={[{ pathname: '/verify-email', state }]}>
        <Routes>
          <Route path="/verify-email" element={<VerifyEmailPage />} />
          <Route path="*" element={<CurrentPath />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('VerifyEmailPage', () => {
  it('подставляет email из состояния навигации', () => {
    renderPage({ email: 'parent@example.com' })

    expect((screen.getByLabelText('Email') as HTMLInputElement).value).toBe('parent@example.com')
  })

  it('проверяет формат email и длину кода', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.type(screen.getByLabelText('Email'), 'not-email')
    await user.type(screen.getByLabelText('Код из письма'), '123')
    await user.click(screen.getByRole('button', { name: 'Подтвердить' }))

    expect(await screen.findByText('Введите корректный email')).toBeTruthy()
    expect(screen.getByText('Код состоит из 6 символов')).toBeTruthy()
    expect(mocks.verifyEmail).not.toHaveBeenCalled()
  })

  it('успешное подтверждение ведёт в кабинет', async () => {
    const user = userEvent.setup()
    mocks.verifyEmail.mockResolvedValue({ id: 'u-1', role: 'parent' })
    mocks.mergeWithSession.mockResolvedValue(undefined)

    renderPage()

    await user.type(screen.getByLabelText('Email'), 'parent@example.com')
    await user.type(screen.getByLabelText('Код из письма'), '123456')
    await user.click(screen.getByRole('button', { name: 'Подтвердить' }))

    await waitFor(() =>
      expect(mocks.verifyEmail).toHaveBeenCalledWith('parent@example.com', '123456'),
    )
    await waitFor(() => expect(screen.getByTestId('path').textContent).toBe('/cabinet'))
  })

  it('неверный код показывает алерт', async () => {
    const user = userEvent.setup()
    mocks.verifyEmail.mockRejectedValue(new Error('Код истёк'))

    renderPage()

    await user.type(screen.getByLabelText('Email'), 'parent@example.com')
    await user.type(screen.getByLabelText('Код из письма'), '123456')
    await user.click(screen.getByRole('button', { name: 'Подтвердить' }))

    await waitFor(() => expect(screen.getByRole('alert')).toBeTruthy())
    expect(screen.getByText('Код истёк')).toBeTruthy()
  })
})
