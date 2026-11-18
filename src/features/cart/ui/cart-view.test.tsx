// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  get: vi.fn(),
  updateQuantity: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}))

vi.mock('@/shared/api/cart-api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/shared/api/cart-api')>()
  return {
    ...actual,
    cartApi: {
      ...actual.cartApi,
      get: mocks.get,
      updateQuantity: mocks.updateQuantity,
      removeItem: mocks.removeItem,
      clear: mocks.clear,
    },
  }
})

import { CartView } from '@/features/cart/ui/cart-view'

let client: QueryClient

beforeEach(() => {
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  mocks.get.mockReset()
  mocks.updateQuantity.mockReset()
  mocks.removeItem.mockReset()
  mocks.clear.mockReset()
})

afterEach(cleanup)

function cartItem(overrides: Record<string, unknown> = {}) {
  return {
    id: 'item-1',
    productId: 'p-1',
    quantity: 2,
    product: {
      id: 'p-1',
      title: 'Брошь «Ромашка»',
      priceKopecks: 45_000,
      stock: 5,
      status: 'active',
    },
    ...overrides,
  }
}

function renderCart() {
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={['/cart']}>
        <Routes>
          <Route path="/cart" element={<CartView />} />
          <Route path="/checkout" element={<p>Страница оформления</p>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('CartView', () => {
  it('без конфликтов остатков ведёт на оформление', async () => {
    const user = userEvent.setup()
    mocks.get.mockResolvedValue({ id: 'cart-1', items: [cartItem()] })

    renderCart()

    const button = await waitFor(() => screen.getByRole('button', { name: 'Оформить заказ' }))
    expect((button as HTMLButtonElement).disabled).toBe(false)

    await user.click(button)

    await waitFor(() => expect(screen.getByText('Страница оформления')).toBeTruthy())
  })

  it('при конфликте остатков блокирует переход к оформлению', async () => {
    const user = userEvent.setup()
    // В корзине 3 штуки,а на складе осталось 2 — конфликт.
    mocks.get.mockResolvedValue({
      id: 'cart-1',
      items: [cartItem({ quantity: 3, product: { ...cartItem().product, stock: 2 } })],
    })

    renderCart()

    const button = await waitFor(() => screen.getByRole('button', { name: 'Оформить заказ' }))
    expect((button as HTMLButtonElement).disabled).toBe(true)
    expect(screen.getByText(/в корзине 3, доступно 2/)).toBeTruthy()

    await user.click(button)

    expect(screen.queryByText('Страница оформления')).toBeNull()
  })
})