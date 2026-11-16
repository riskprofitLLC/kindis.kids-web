// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  categories: vi.fn(),
  createCategory: vi.fn(),
  deleteCategory: vi.fn(),
}))

vi.mock('@/shared/api/admin-api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/shared/api/admin-api')>()
  return {
    ...actual,
    adminApi: {
      ...actual.adminApi,
      categories: mocks.categories,
      createCategory: mocks.createCategory,
      deleteCategory: mocks.deleteCategory,
    },
  }
})

import AdminCategoriesPage from '@/pages/admin/ui/admin-categories-page'

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
        <AdminCategoriesPage />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('AdminCategoriesPage', () => {
  it('создаёт категорию по имени и slug', async () => {
    const user = userEvent.setup()
    mocks.categories.mockResolvedValue([])
    mocks.createCategory.mockResolvedValue({ id: 'c-1' })

    renderPage()

    await waitFor(() => expect(screen.getByRole('button', { name: 'Создать' })).toBeTruthy())
    await user.type(screen.getByLabelText('Название'), 'Украшения')
    await user.type(screen.getByLabelText('Slug'), 'jewelry')
    await user.click(screen.getByRole('button', { name: 'Создать' }))

    await waitFor(() =>
      expect(mocks.createCategory).toHaveBeenCalledWith({ name: 'Украшения', slug: 'jewelry' }),
    )
  })

  it('без имени или slug не создаёт категорию', async () => {
    const user = userEvent.setup()
    mocks.categories.mockResolvedValue([])

    renderPage()

    await waitFor(() => expect(screen.getByRole('button', { name: 'Создать' })).toBeTruthy())
    await user.type(screen.getByLabelText('Название'), 'Украшения')
    await user.click(screen.getByRole('button', { name: 'Создать' }))

    expect(mocks.createCategory).not.toHaveBeenCalled()
  })

  it('рисует дерево категорий с вложенностью и удаляет узел', async () => {
    const user = userEvent.setup()
    mocks.categories.mockResolvedValue([
      {
        id: 'c-1',
        name: 'Украшения',
        children: [{ id: 'c-2', name: 'Серьги', children: [] }],
      },
    ])
    mocks.deleteCategory.mockResolvedValue(undefined)

    renderPage()

    await waitFor(() => expect(screen.getByText('Украшения')).toBeTruthy())
    expect(screen.getByText('Серьги')).toBeTruthy()

    const buttons = screen.getAllByRole('button', { name: 'Удалить' })
    expect(buttons).toHaveLength(2)
    await user.click(buttons[1])

    await waitFor(() => expect(mocks.deleteCategory).toHaveBeenCalledWith('c-2'))
  })

  it('ошибку создания или удаления показывает алертом', async () => {
    const user = userEvent.setup()
    mocks.categories.mockResolvedValue([{ id: 'c-1', name: 'Украшения' }])
    mocks.deleteCategory.mockRejectedValue(new Error('не пуста'))

    renderPage()

    await waitFor(() => expect(screen.getByRole('button', { name: 'Удалить' })).toBeTruthy())
    await user.click(screen.getByRole('button', { name: 'Удалить' }))

    await waitFor(() => expect(screen.getByRole('alert')).toBeTruthy())
  })
})
