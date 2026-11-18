// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  mine: vi.fn(),
  messages: vi.fn(),
  send: vi.fn(),
  markRead: vi.fn(),
}))

vi.mock('@/shared/api/orders-api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/shared/api/orders-api')>()
  return { ...actual, ordersApi: { ...actual.ordersApi, mine: mocks.mine } }
})

vi.mock('@/shared/api/seller-api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/shared/api/seller-api')>()
  return {
    ...actual,
    sellerApi: {
      ...actual.sellerApi,
      messages: mocks.messages,
      sendMessage: mocks.send,
      markRead: mocks.markRead,
    },
  }
})

import { useSessionStore } from '@/entities/session/model/session-store'
import { ContactSellerButton } from '@/features/chat/ui/contact-seller-button'

let client: QueryClient

beforeEach(() => {
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  vi.clearAllMocks()
  useSessionStore.getState().clearSession()
})

afterEach(() => {
  cleanup()
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
          <Route
            path="/product/:id"
            element={<ContactSellerButton productId="p-1" sellerName="Коля Иванов" />}
          />
          <Route path="/login" element={<CurrentPath />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

function authenticate() {
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
}

describe('ContactSellerButton', () => {
  it('гостя отправляет на вход', async () => {
    const user = userEvent.setup()
    renderButton()

    await user.click(screen.getByRole('button', { name: 'Написать продавцу' }))

    await waitFor(() => expect(screen.getByTestId('path').textContent).toBe('/login'))
    expect(mocks.mine).not.toHaveBeenCalled()
  })

  it('покупателю с заказом открывает диалог по заказу', async () => {
    const user = userEvent.setup()
    authenticate()
    mocks.mine.mockResolvedValue([
      {
        id: 'o-1',
        status: 'delivered',
        totalKopecks: 65000,
        deliveryMethod: null,
        addressJson: null,
        comment: null,
        trackingNumber: null,
        cancelReason: null,
        createdAt: '2026-11-10T10:00:00Z',
        items: [
          {
            id: 'oi-1',
            productId: 'p-1',
            quantity: 1,
            priceKopecks: 65000,
            titleSnapshot: 'Серьги',
          },
        ],
      },
    ])
    mocks.messages.mockResolvedValue([
      {
        id: 'm-1',
        text: 'Здравствуйте!',
        senderId: 'u-2',
        senderName: 'Коля Иванов',
        createdAt: '2026-11-10T11:00:00Z',
      },
    ])
    mocks.markRead.mockResolvedValue(undefined)

    renderButton()

    await user.click(screen.getByRole('button', { name: 'Написать продавцу' }))

    await waitFor(() => expect(screen.getByText(/Чат с Коля Иванов/)).toBeTruthy())
    await waitFor(() => expect(screen.getByText(/Здравствуйте!/)).toBeTruthy())
    expect(mocks.markRead).toHaveBeenCalledWith('o-1')
  })

  it('без заказов объясняет,что диалог открывается по заказу', async () => {
    const user = userEvent.setup()
    authenticate()
    mocks.mine.mockResolvedValue([])

    renderButton()

    await user.click(screen.getByRole('button', { name: 'Написать продавцу' }))

    await waitFor(() =>
      expect(screen.getByText(/Диалог с продавцом открывается по заказу/)).toBeTruthy(),
    )
    expect(mocks.messages).not.toHaveBeenCalled()
  })
})
