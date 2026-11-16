// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  mineChildren: vi.fn(),
  mineProducts: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  submit: vi.fn(),
  categories: vi.fn(),
}))

vi.mock('@/shared/api/children-api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/shared/api/children-api')>()
  return { ...actual, childrenApi: { ...actual.childrenApi, mine: mocks.mineChildren } }
})

vi.mock('@/shared/api/products-api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/shared/api/products-api')>()
  return {
    ...actual,
    productsApi: {
      ...actual.productsApi,
      mine: mocks.mineProducts,
      create: mocks.create,
      update: mocks.update,
      submit: mocks.submit,
    },
  }
})

vi.mock('@/shared/api/catalog-api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/shared/api/catalog-api')>()
  return { ...actual, catalogApi: { ...actual.catalogApi, categories: mocks.categories } }
})

// Медиа-редактор тянет загрузку файлов — на уровне страницы он не нужен.
vi.mock('@/features/seller/ui/product-media-editor', () => ({
  ProductMediaEditor: ({ productId }: { productId: string }) => <p>Медиа товара {productId}</p>,
}))

import SellerProductFormPage from '@/pages/cabinet/ui/seller-product-form-page'

let client: QueryClient

beforeEach(() => {
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  vi.clearAllMocks()
})

afterEach(cleanup)

function CurrentPath() {
  return <p data-testid="path">{useLocation().pathname}</p>
}

function renderPage(path = '/cabinet/products/new') {
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/cabinet/products/new" element={<SellerProductFormPage />} />
          <Route path="/cabinet/products/:productId/edit" element={<SellerProductFormPage />} />
          <Route path="*" element={<CurrentPath />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('SellerProductFormPage', () => {
  it('показывает скелетон, пока грузятся профили', () => {
    mocks.mineChildren.mockReturnValue(new Promise(() => {}))

    renderPage()

    expect(screen.queryByRole('button', { name: 'Сохранить черновик' })).toBeNull()
  })

  it('новый товар — заголовок и поля формы', async () => {
    mocks.mineChildren.mockResolvedValue([{ id: 'cp-1' }])
    mocks.mineProducts.mockResolvedValue([])
    mocks.categories.mockResolvedValue([])

    renderPage()

    await waitFor(() => expect(screen.getByText('Новый товар')).toBeTruthy())
    expect(screen.getByLabelText('Название')).toBeTruthy()
    expect(screen.getByLabelText('Описание')).toBeTruthy()
    expect(screen.getByLabelText(/Цена/)).toBeTruthy()
    expect(screen.getByLabelText('Остаток')).toBeTruthy()
    expect(screen.getByLabelText('Категория')).toBeTruthy()
    expect(screen.queryByText(/Медиа товара/)).toBeNull()
  })

  it('без названия и цены показывает ошибку валидации', async () => {
    const user = userEvent.setup()
    mocks.mineChildren.mockResolvedValue([{ id: 'cp-1' }])
    mocks.mineProducts.mockResolvedValue([])
    mocks.categories.mockResolvedValue([])

    renderPage()

    await waitFor(() => expect(screen.getByRole('button', { name: 'Сохранить черновик' })).toBeTruthy())
    await user.click(screen.getByRole('button', { name: 'Сохранить черновик' }))

    await waitFor(() => expect(screen.getByRole('alert')).toBeTruthy())
    expect(screen.getByText('Заполните название и цену')).toBeTruthy()
    expect(mocks.create).not.toHaveBeenCalled()
  })

it('сохраняет черновик и уходит в список товаров', async () => {
    const user = userEvent.setup()
    mocks.mineChildren.mockResolvedValue([{ id: 'cp-1' }])
    mocks.mineProducts.mockResolvedValue([])
    mocks.categories.mockResolvedValue([])
    mocks.create.mockResolvedValue({ id: 'p-9', status: 'draft' })

    renderPage()

    await waitFor(() => expect(screen.getByLabelText('Название')).toBeTruthy())
    await user.type(screen.getByLabelText('Название'), 'Серьги «Лаванда»')
    await user.type(screen.getByLabelText('Описание'), 'Ручная работа')
    await user.clear(screen.getByLabelText(/Цена/))
    await user.type(screen.getByLabelText(/Цена/), '650')
    await user.clear(screen.getByLabelText('Остаток'))
    await user.type(screen.getByLabelText('Остаток'), '4')
    await user.click(screen.getByRole('button', { name: 'Сохранить черновик' }))

    await waitFor(() => expect(mocks.create).toHaveBeenCalledTimes(1))
    expect(mocks.create).toHaveBeenCalledWith('cp-1', {
      title: 'Серьги «Лаванда»',
      description: 'Ручная работа',
      priceKopecks: 65_000,
      stock: 4,
      categoryId: null,
    })
    expect(mocks.submit).not.toHaveBeenCalled()
    await waitFor(() => expect(screen.getByTestId('path').textContent).toBe('/cabinet/products'))
  })

  it('публикация сразу отправляет созданный товар на модерацию', async () => {
    const user = userEvent.setup()
    mocks.mineChildren.mockResolvedValue([{ id: 'cp-1' }])
    mocks.mineProducts.mockResolvedValue([])
    mocks.categories.mockResolvedValue([])
    mocks.create.mockResolvedValue({ id: 'p-9', status: 'draft' })
    mocks.submit.mockResolvedValue({ id: 'p-9', status: 'pending_review' })

    renderPage()

    await waitFor(() => expect(screen.getByLabelText('Название')).toBeTruthy())
    await user.type(screen.getByLabelText('Название'), 'Брошь')
    await user.clear(screen.getByLabelText(/Цена/))
    await user.type(screen.getByLabelText(/Цена/), '120')
    await user.click(screen.getByRole('button', { name: 'Опубликовать на модерацию' }))

    await waitFor(() => expect(mocks.submit).toHaveBeenCalledWith('p-9'))
  })

  it('редактирование подставляет значения товара и показывает медиа', async () => {
    mocks.mineChildren.mockResolvedValue([{ id: 'cp-1' }])
    mocks.mineProducts.mockResolvedValue([
      {
        id: 'p-1',
        title: 'Серьги «Лаванда»',
        description: 'Ручная работа',
        priceKopecks: 65_000,
        stock: 3,
        status: 'draft',
        categoryId: null,
        createdAt: '2026-11-01T10:00:00Z',
      },
    ])
    mocks.categories.mockResolvedValue([])

    renderPage('/cabinet/products/p-1/edit')

    await waitFor(() => expect(screen.getByText('Редактирование товара')).toBeTruthy())
    expect((screen.getByLabelText('Название') as HTMLInputElement).value).toBe(
      'Серьги «Лаванда»',
    )
    expect((screen.getByLabelText(/Цена/) as HTMLInputElement).value).toBe('650')
    expect(screen.getByText('Медиа товара p-1')).toBeTruthy()
  })
})
