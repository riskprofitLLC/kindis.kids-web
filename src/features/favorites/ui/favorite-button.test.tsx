// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  list: vi.fn(),
  add: vi.fn(),
  remove: vi.fn(),
}))

vi.mock('@/shared/api/favorites-api', () => ({
  favoritesApi: {
    list: (...args: unknown[]) => mocks.list(...args),
    add: (...args: unknown[]) => mocks.add(...args),
    remove: (...args: unknown[]) => mocks.remove(...args),
  },
}))

import { useSessionStore } from '@/entities/session/model/session-store'
import { FavoriteButton } from '@/features/favorites/ui/favorite-button'

let client: QueryClient

beforeEach(() => {
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  vi.clearAllMocks()
  useSessionStore.getState().clearSession()
})

afterEach(() => {
  useSessionStore.getState().clearSession()
})

function CurrentPath() {
  return <p data-testid="path">{useLocation().pathname}</p>
}

function renderButton() {
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={['/product/p-1']}>
        <Routes>
          <Route path="/product/:id" element={<FavoriteButton productId="p-1" />} />
          <Route path="/login" element={<CurrentPath />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('FavoriteButton', () => {
  it('гостя отправляет на вход, сохраняя текущий путь', async () => {
    const user = userEvent.setup()
    renderButton()

    await user.click(screen.getByRole('button', { name: 'В избранное' }))

    await waitFor(() => expect(screen.getByTestId('path').textContent).toBe('/login'))
    expect(mocks.add).not.toHaveBeenCalled()
  })

  it('покупатель добавляет товар в избранное', async () => {
    const user = userEvent.setup()
    mocks.list.mockResolvedValue([])
    mocks.add.mockResolvedValue(undefined)
    useSessionStore.setState({
      user: {
        id: 'u-1',
        email: 'parent@example.com',
        fullName: 'Родитель',
        phone: null,
        city: null,
        role: 'parent',
      },
      status: 'authenticated',
    })

    renderButton()

    const button = await waitFor(() => screen.getByRole('button', { name: 'В избранное' }))
    await user.click(button)

    await waitFor(() => expect(mocks.add).toHaveBeenCalledWith('p-1'))
  })

  it('товар уже в избранном — кнопка убирает его', async () => {
    const user = userEvent.setup()
    mocks.list.mockResolvedValue([{ id: 'p-1', title: 'Серьги', priceKopecks: 65000, stock: 1 }])
    mocks.remove.mockResolvedValue(undefined)
    useSessionStore.setState({
      user: {
        id: 'u-1',
        email: 'parent@example.com',
        fullName: 'Родитель',
        phone: null,
        city: null,
        role: 'parent',
      },
      status: 'authenticated',
    })

    renderButton()

    const button = await waitFor(() =>
      screen.getByRole('button', { name: 'Убрать из избранного' }),
    )
    expect(button.getAttribute('aria-pressed')).toBe('true')
    await user.click(button)

    await waitFor(() => expect(mocks.remove).toHaveBeenCalledWith('p-1'))
  })
})