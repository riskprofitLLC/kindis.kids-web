// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  dialogs: vi.fn(),
  messages: vi.fn(),
  sendMessage: vi.fn(),
  markRead: vi.fn(),
}))

vi.mock('@/shared/api/seller-api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/shared/api/seller-api')>()
  return {
    ...actual,
    sellerApi: {
      ...actual.sellerApi,
      dialogs: mocks.dialogs,
      messages: mocks.messages,
      sendMessage: mocks.sendMessage,
      markRead: mocks.markRead,
    },
  }
})

import ChatsPage from '@/pages/cabinet/ui/chats-page'

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
        <ChatsPage />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('ChatsPage', () => {
  it('без диалогов просит выбрать и пишет подсказку', async () => {
    mocks.dialogs.mockResolvedValue([])

    renderPage()

    await waitFor(() =>
      expect(
        screen.getByText('Диалогов пока нет - они появятся, когда покупатели напишут по заказам.'),
      ).toBeTruthy(),
    )
    expect(screen.getByText('Выберите диалог слева.')).toBeTruthy()
  })

  it('показывает диалоги со счётчиком непрочитанных', async () => {
    mocks.dialogs.mockResolvedValue([
      {
        orderId: 'o-1',
        counterpartName: 'Мария',
        lastMessage: {
          id: 'm-1',
          text: 'Когда отправка?',
          createdAt: '',
          senderId: 'u-2',
          readAt: null,
          mine: false,
        },
        unreadCount: 2,
      },
    ])

    renderPage()

    await waitFor(() => expect(screen.getByRole('button', { name: /Мария/ })).toBeTruthy())
    expect(screen.getByText('2')).toBeTruthy()
    expect(screen.getByText('Когда отправка?')).toBeTruthy()
  })

  it('открытие диалога грузит переписку и помечает прочтённым', async () => {
    const user = userEvent.setup()
    mocks.dialogs.mockResolvedValue([
      {
        orderId: 'o-1',
        counterpartName: 'Мария',
        lastMessage: null,
        unreadCount: 0,
      },
    ])
    mocks.messages.mockResolvedValue([
      {
        id: 'm-1',
        text: 'Здравствуйте!',
        senderId: 'u-2',
        createdAt: '',
        sender: { id: 'u-2', fullName: 'Мария' },
      },
    ])
    mocks.markRead.mockResolvedValue(undefined)

    renderPage()

    await waitFor(() => expect(screen.getByRole('button', { name: /Мария/ })).toBeTruthy())
    await user.click(screen.getByRole('button', { name: /Мария/ }))

    await waitFor(() => expect(mocks.messages).toHaveBeenCalledWith('o-1'))
    expect(mocks.markRead).toHaveBeenCalledWith('o-1')
    expect(screen.getByText(/Здравствуйте!/)).toBeTruthy()
  })

  it('отправляет сообщение и очищает поле', async () => {
    const user = userEvent.setup()
    mocks.dialogs.mockResolvedValue([
      {
        orderId: 'o-1',
        counterpartName: 'Мария',
        lastMessage: null,
        unreadCount: 0,
      },
    ])
    mocks.messages.mockResolvedValue([])
    mocks.markRead.mockResolvedValue(undefined)
    mocks.sendMessage.mockResolvedValue({ id: 'm-2' })

    renderPage()

    await waitFor(() => expect(screen.getByRole('button', { name: /Мария/ })).toBeTruthy())
    await user.click(screen.getByRole('button', { name: /Мария/ }))
    await waitFor(() => expect(screen.getByPlaceholderText('Написать сообщение')).toBeTruthy())

    const input = screen.getByPlaceholderText('Написать сообщение') as HTMLInputElement
    await user.type(input, 'Отправляю сегодня')
    await user.click(screen.getByRole('button', { name: 'Отправить' }))

    await waitFor(() => expect(mocks.sendMessage).toHaveBeenCalledWith('o-1', 'Отправляю сегодня'))
    expect(input.value).toBe('')
  })
})
