// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  attributes: vi.fn(),
  createAttribute: vi.fn(),
  deleteAttribute: vi.fn(),
}))

vi.mock('@/shared/api/admin-api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/shared/api/admin-api')>()
  return {
    ...actual,
    adminApi: {
      ...actual.adminApi,
      attributes: mocks.attributes,
      createAttribute: mocks.createAttribute,
      deleteAttribute: mocks.deleteAttribute,
    },
  }
})

import AdminAttributesPage from '@/pages/admin/ui/admin-attributes-page'

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
        <AdminAttributesPage />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('AdminAttributesPage', () => {
  it('создаёт характеристику с единицей', async () => {
    const user = userEvent.setup()
    mocks.attributes.mockResolvedValue([])
    mocks.createAttribute.mockResolvedValue({ id: 'a-1' })

    renderPage()

    await waitFor(() => expect(screen.getByRole('button', { name: 'Создать' })).toBeTruthy())
    await user.type(screen.getByLabelText('Название'), 'Длина')
    await user.type(screen.getByLabelText('Единица'), 'см')
    await user.click(screen.getByRole('button', { name: 'Создать' }))

    await waitFor(() =>
      expect(mocks.createAttribute).toHaveBeenCalledWith({ name: 'Длина', type: 'text', unit: 'см' }),
    )
  })

  it('без названия не создаёт характеристику', async () => {
    const user = userEvent.setup()
    mocks.attributes.mockResolvedValue([])

    renderPage()

    await waitFor(() => expect(screen.getByRole('button', { name: 'Создать' })).toBeTruthy())
    await user.type(screen.getByLabelText('Единица'), 'см')
    await user.click(screen.getByRole('button', { name: 'Создать' }))

    expect(mocks.createAttribute).not.toHaveBeenCalled()
  })

  it('показывает список характеристик и удаляет запись', async () => {
    const user = userEvent.setup()
    mocks.attributes.mockResolvedValue([
      { id: 'a-1', name: 'Длина', unit: 'см' },
      { id: 'a-2', name: 'Цвет', unit: null },
    ])
    mocks.deleteAttribute.mockResolvedValue(undefined)

    renderPage()

    await waitFor(() => expect(screen.getByText(/Длина/)).toBeTruthy())
    expect(screen.getByText(/Цвет/)).toBeTruthy()

    await user.click(screen.getAllByRole('button', { name: 'Удалить' })[0])

    await waitFor(() => expect(mocks.deleteAttribute).toHaveBeenCalledWith('a-1'))
  })
})
