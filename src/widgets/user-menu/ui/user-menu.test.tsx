// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({ logout: vi.fn() }))

vi.mock('@/shared/api/auth-api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/shared/api/auth-api')>()
  return { ...actual, authApi: { ...actual.authApi, logout: mocks.logout } }
})

import { useSessionStore } from '@/entities/session/model/session-store'
import { UserMenu } from '@/widgets/user-menu/ui/user-menu'

let client: QueryClient

beforeEach(() => {
  client = new QueryClient({ defaultOptions: { mutations: { retry: false } } })
  useSessionStore.getState().clearSession()
  vi.clearAllMocks()
})

afterEach(cleanup)

function CurrentPath() {
  return <p data-testid="path">{useLocation().pathname}</p>
}

function renderMenu() {
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={['/catalog']}>
        <UserMenu />
        <Routes>
          <Route path="*" element={<CurrentPath />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('UserMenu', () => {
  it('анониму показывает кнопку входа', () => {
    renderMenu()

    expect(screen.getByRole('link', { name: 'Войти' }).getAttribute('href')).toBe('/login')
  })

  it('авторизованному показывает имя и выход в кабинет', () => {
    useSessionStore.getState().setSession({
      id: 'u-1',
      email: 'parent@example.com',
      fullName: 'Мария',
      phone: null,
      city: null,
      role: 'parent',
    })

    renderMenu()

    expect(screen.getByRole('link', { name: 'Мария' }).getAttribute('href')).toBe('/cabinet')
    expect(screen.getByRole('button', { name: 'Выйти' })).toBeTruthy()
  })

  it('без имени показывает email', () => {
    useSessionStore.getState().setSession({
      id: 'u-1',
      email: 'parent@example.com',
      fullName: null,
      phone: null,
      city: null,
      role: 'parent',
    })

    renderMenu()

    expect(screen.getByRole('link', { name: 'parent@example.com' })).toBeTruthy()
  })

  it('выход чистит сессию и уводит на главную', async () => {
    const user = userEvent.setup()
    mocks.logout.mockResolvedValue(undefined)
    useSessionStore.getState().setSession({
      id: 'u-1',
      email: 'parent@example.com',
      fullName: 'Мария',
      phone: null,
      city: null,
      role: 'parent',
    })

    renderMenu()

    await user.click(screen.getByRole('button', { name: 'Выйти' }))

    await waitFor(() => expect(mocks.logout).toHaveBeenCalled())
    expect(useSessionStore.getState().user).toBeNull()
    await waitFor(() => expect(screen.getByTestId('path').textContent).toBe('/'))
  })
})
