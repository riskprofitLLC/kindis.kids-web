// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  getCart: vi.fn(),
  checkout: vi.fn(),
}))

vi.mock('@/shared/api/cart-api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/shared/api/cart-api')>()
  return { ...actual, cartApi: { ...actual.cartApi, get: mocks.getCart } }
})

vi.mock('@/shared/api/orders-api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/shared/api/orders-api')>()
  return { ...actual, ordersApi: { ...actual.ordersApi, checkout: mocks.checkout } }
})

import { useSessionStore } from '@/entities/session/model/session-store'
import CheckoutPage from '@/pages/checkout/ui/checkout-page'

let client: QueryClient

// Заказ создаётся без доставки:в ответе только сумма товаров (2 × 450 ₽).
const placedOrder = {
  id: 'order-1',
  status: 'created' as const,
  totalKopecks: 90_000,
  deliveryMethod: 'pickup' as const,
  addressJson: null,
  comment: null,
  trackingNumber: null,
  cancelReason: null,
  createdAt: '2026-01-01T00:00:00.000Z',
}

beforeEach(() => {
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  vi.clearAllMocks()
  useSessionStore.setState({
    user: {
      id: 'u-1',
      email: 'buyer@example.com',
      fullName: 'Аня',
      phone: null,
      city: null,
      role: 'buyer',
    },
    status: 'authenticated',
  })
  mocks.getCart.mockResolvedValue({
    id: 'cart-1',
    items: [
      {
        id: 'item-1',
        quantity: 2,
        productId: 'p-1',
        product: {
          id: 'p-1',
          title: 'Брошь «Ромашка»',
          priceKopecks: 45_000,
          stock: 5,
          status: 'active',
        },
      },
    ],
  })
})

mocks.checkout.mockResolvedValue(placedOrder)

afterEach(cleanup)

function renderPage() {
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={['/checkout']}>
        <Routes>
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/cabinet" element={<p data-testid="cabinet">Обзор кабинета</p>} />
          <Route path="/cabinet/orders" element={<p data-testid="orders">Список заказов</p>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

// Проход до шага подтверждения:self-вызов — адрес не требуется.
async function goToConfirmStep(user: ReturnType<typeof userEvent.setup>) {
  await user.click(await screen.findByRole('button', { name: /Далее/ }))
  await user.click(screen.getByRole('button', { name: /Далее/ }))
}

describe('CheckoutPage — итог заказа', () => {
  it('помечает стоимость доставки как ориентировочную', async () => {
    const user = userEvent.setup()
    renderPage()

    await goToConfirmStep(user)

    const totals = screen.getByText('Итого').closest('dl')
    expect(totals?.textContent).toContain('Доставка (ориентировочно)')
    expect(screen.getByText(/рассчитывается при оплате/)).toBeTruthy()
    // Итого по-прежнему показывает сумму товаров вместе с доставкой.
    expect(screen.getByText('Итого').nextElementSibling?.textContent).toMatch(/^900/)
  })

  it('ссылка «Мои заказы» ведёт на список заказов кабинета', async () => {
    const user = userEvent.setup()
    renderPage()

    await goToConfirmStep(user)
    await user.click(screen.getByRole('button', { name: 'Подтвердить заказ' }))

    expect(await screen.findByText('Заказ оформлен')).toBeTruthy()
    const link = screen.getByRole('link', { name: 'Мои заказы' })
    expect(link.getAttribute('href')).toBe('/cabinet/orders')

    await user.click(link)
    expect(await screen.findByTestId('orders')).toBeTruthy()
  })

  it('создаёт заказ без доставки и показывает только сумму товаров', async () => {
    const user = userEvent.setup()
    renderPage()

    await goToConfirmStep(user)
    await user.click(screen.getByRole('button', { name: 'Подтвердить заказ' }))
    await screen.findByText('Заказ оформлен')

    const [input] = mocks.checkout.mock.calls[0]
    expect(input.deliveryMethod).toBe('pickup')
    expect(input.address).toBeUndefined()
    expect(screen.getByText(/Сумма товаров/).textContent).toMatch(/900/)
  })
})
