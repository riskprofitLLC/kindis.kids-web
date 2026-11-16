// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  mine: vi.fn(),
  update: vi.fn(),
  submit: vi.fn(),
  archive: vi.fn(),
  restore: vi.fn(),
}))

vi.mock('@/shared/api/products-api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/shared/api/products-api')>()
  return {
    ...actual,
    productsApi: {
      ...actual.productsApi,
      mine: mocks.mine,
      update: mocks.update,
      submit: mocks.submit,
      archive: mocks.archive,
      restore: mocks.restore,
    },
  }
})

import SellerProductsPage from '@/pages/cabinet/ui/seller-products-page'

let client: QueryClient

const products = [
  {
    id: 'p-1',
    title: 'Серьги «Лаванда»',
    description: null,
    priceKopecks: 65_000,
    stock: 3,
    status: 'draft',
    categoryId: null,
    createdAt: '2026-11-01T10:00:00Z',
  },
  {
    id: 'p-2',
    title: 'Брошь «Кот»',
    description: null,
    priceKopecks: 12_000,
    stock: 1,
    status: 'active',
    categoryId: null,
    createdAt: '2026-11-02T10:00:00Z',
  },
]

beforeEach(() => {
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  vi.clearAllMocks()
})

afterEach(cleanup)

function renderPage() {
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <SellerProductsPage />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('SellerProductsPage', () => {
  it('во время загрузки показывает скелетон', () => {
    mocks.mine.mockReturnValue(new Promise(() => {}))

    renderPage()

    expect(screen.queryByText('Серьги «Лаванда»')).toBeNull()
  })

  it('без товаров пишет, что ничего не найдено', async () => {
    mocks.mine.mockResolvedValue([])

    renderPage()

    await waitFor(() => expect(screen.getByText('Товаров не найдено.')).toBeTruthy())
  })

  it('фильтрует список по статусу и поисковому слову', async () => {
    const user = userEvent.setup()
    mocks.mine.mockResolvedValue(products)

    renderPage()

    await waitFor(() => expect(screen.getByText('Серьги «Лаванда»')).toBeTruthy())

    await user.selectOptions(screen.getByRole('combobox'), 'active')
    expect(screen.queryByText('Серьги «Лаванда»')).toBeNull()
    expect(screen.getByText('Брошь «Кот»')).toBeTruthy()

    await user.selectOptions(screen.getByRole('combobox'), '')
    await user.type(screen.getByLabelText('Поиск по названию'), 'брошь')
    expect(screen.queryByText('Серьги «Лаванда»')).toBeNull()
    expect(screen.getByText('Брошь «Кот»')).toBeTruthy()
  })

  it('инлайн-правка цены на blur уходит в продукт-api', async () => {
    const user = userEvent.setup()
    mocks.mine.mockResolvedValue(products)
    mocks.update.mockResolvedValue(products[0])

    renderPage()

    await waitFor(() => expect(screen.getByDisplayValue('650')).toBeTruthy())

    const price = screen.getByDisplayValue('650')
    await user.clear(price)
    await user.type(price, '700')
    await user.tab()

    await waitFor(() =>
      expect(mocks.update).toHaveBeenCalledWith('p-1', { priceKopecks: 70_000 }),
    )
  })

  it('инлайн-правка остатка на blur уходит в продукт-api', async () => {
    const user = userEvent.setup()
    mocks.mine.mockResolvedValue(products)
    mocks.update.mockResolvedValue(products[0])

    renderPage()

    await waitFor(() => expect(screen.getByDisplayValue('3')).toBeTruthy())

    const stock = screen.getByDisplayValue('3')
    await user.clear(stock)
    await user.type(stock, '7')
    await user.tab()

    await waitFor(() => expect(mocks.update).toHaveBeenCalledWith('p-1', { stock: 7 }))
  })

  it('черновик отправляется на модерацию', async () => {
    const user = userEvent.setup()
    mocks.mine.mockResolvedValue(products)
    mocks.submit.mockResolvedValue({ ...products[0], status: 'pending_review' })

    renderPage()

    await waitFor(() => expect(screen.getByRole('button', { name: 'На модерацию' })).toBeTruthy())
    await user.click(screen.getByRole('button', { name: 'На модерацию' }))

    await waitFor(() => expect(mocks.submit).toHaveBeenCalledWith('p-1'))
  })

  it('активный товар уходит в архив, архивный возвращается', async () => {
    const user = userEvent.setup()
    mocks.mine.mockResolvedValue([
      products[1],
      { ...products[0], id: 'p-3', title: 'Архивная брошь', status: 'archived' },
    ])
    mocks.archive.mockResolvedValue(products[1])
    mocks.restore.mockResolvedValue(products[0])

    renderPage()

    await waitFor(() => expect(screen.getByRole('button', { name: 'В архив' })).toBeTruthy())

    await user.click(screen.getByRole('button', { name: 'В архив' }))
    await waitFor(() => expect(mocks.archive).toHaveBeenCalledWith('p-2'))

    await user.click(screen.getByRole('button', { name: 'Вернуть из архива' }))
    await waitFor(() => expect(mocks.restore).toHaveBeenCalledWith('p-3'))
  })
})
