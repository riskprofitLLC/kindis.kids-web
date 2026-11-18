// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  profiles: vi.fn(),
  products: vi.fn(),
  act: vi.fn(),
}))

vi.mock('@/shared/api/admin-api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/shared/api/admin-api')>()
  return {
    ...actual,
    adminApi: {
      ...actual.adminApi,
      profiles: mocks.profiles,
      products: mocks.products,
      act: mocks.act,
    },
  }
})

import ModerationPage from '@/pages/admin/ui/moderation-page'

let client: QueryClient

beforeEach(() => {
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  vi.clearAllMocks()
})

afterEach(cleanup)

function renderPage() {
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <ModerationPage />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('ModerationPage', () => {
  it('во время загрузки очереди показывает скелетон', () => {
    mocks.profiles.mockReturnValue(new Promise(() => {}))

    renderPage()

    expect(screen.queryByRole('button', { name: 'Одобрить' })).toBeNull()
  })

  it('пустая очередь — всё разобрано', async () => {
    mocks.profiles.mockResolvedValue([])

    renderPage()

    await waitFor(() => expect(screen.getByText('Очередь пуста — всё разобрано.')).toBeTruthy())
  })

  it('одобрение профиля из очереди', async () => {
    const user = userEvent.setup()
    mocks.profiles.mockResolvedValue([{ id: 'cp-1', name: 'Коля Иванов' }])
    mocks.act.mockResolvedValue(undefined)

    renderPage()

    await waitFor(() => expect(screen.getByText('Коля Иванов')).toBeTruthy())
    await user.click(screen.getByRole('button', { name: 'Одобрить' }))

    await waitFor(() => expect(mocks.act).toHaveBeenCalledWith('profiles', 'cp-1', 'approve'))
  })

  it('отклонение профиля из очереди', async () => {
    const user = userEvent.setup()
    mocks.profiles.mockResolvedValue([{ id: 'cp-1', name: 'Коля Иванов' }])
    mocks.act.mockResolvedValue(undefined)

    renderPage()

    await waitFor(() => expect(screen.getByRole('button', { name: 'Отклонить' })).toBeTruthy())
    await user.click(screen.getByRole('button', { name: 'Отклонить' }))

    await waitFor(() => expect(mocks.act).toHaveBeenCalledWith('profiles', 'cp-1', 'reject'))
  })

  it('переключение на очередь товаров', async () => {
    const user = userEvent.setup()
    mocks.profiles.mockResolvedValue([])
    mocks.products.mockResolvedValue([{ id: 'p-1', title: 'Серьги «Лаванда»' }])

    renderPage()

    await waitFor(() => expect(mocks.profiles).toHaveBeenCalled())
    await user.click(screen.getByRole('tab', { name: 'Товары' }))

    await waitFor(() => expect(mocks.products).toHaveBeenCalled())
    expect(screen.getByText('Серьги «Лаванда»')).toBeTruthy()
  })

  it('ошибку действия показывает алертом', async () => {
    const user = userEvent.setup()
    const { ApiError } = await import('@/shared/api/errors')
    mocks.profiles.mockResolvedValue([{ id: 'cp-1', name: 'Коля Иванов' }])
    mocks.act.mockRejectedValue(new ApiError('Нет прав', 403))

    renderPage()

    await waitFor(() => expect(screen.getByRole('button', { name: 'Одобрить' })).toBeTruthy())
    await user.click(screen.getByRole('button', { name: 'Одобрить' }))

    await waitFor(() => expect(screen.getByRole('alert')).toBeTruthy())
    expect(screen.getByText('Нет прав')).toBeTruthy()
  })
})
