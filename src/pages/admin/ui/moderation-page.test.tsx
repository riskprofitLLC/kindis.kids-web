// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  profiles: vi.fn(),
  products: vi.fn(),
  reports: vi.fn(),
  act: vi.fn(),
  resolveReport: vi.fn(),
}))

vi.mock('@/shared/api/admin-api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/shared/api/admin-api')>()
  return {
    ...actual,
    adminApi: {
      ...actual.adminApi,
      profiles: mocks.profiles,
      products: mocks.products,
      reports: mocks.reports,
      act: mocks.act,
      resolveReport: mocks.resolveReport,
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

  it('отклонение профиля — диалог с причиной, отмена не отклоняет', async () => {
    const user = userEvent.setup()
    mocks.profiles.mockResolvedValue([{ id: 'cp-1', name: 'Коля Иванов' }])
    mocks.act.mockResolvedValue(undefined)

    renderPage()

    await waitFor(() => expect(screen.getByRole('button', { name: 'Отклонить' })).toBeTruthy())
    await user.click(screen.getByRole('button', { name: 'Отклонить' }))

    const dialog = await screen.findByRole('dialog')
    expect(mocks.act).not.toHaveBeenCalled()

    await user.click(within(dialog).getByRole('button', { name: 'Отмена' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    expect(mocks.act).not.toHaveBeenCalled()

    await user.click(screen.getByRole('button', { name: 'Отклонить' }))
    const reopened = await screen.findByRole('dialog')
    await user.type(within(reopened).getByLabelText('Причина (необязательно)'), 'Виден адрес школы')
    await user.click(within(reopened).getByRole('button', { name: 'Отклонить' }))

    await waitFor(() =>
      expect(mocks.act).toHaveBeenCalledWith('profiles', 'cp-1', 'reject', 'Виден адрес школы'),
    )
  })

  it('блокировка профиля — подтверждение в диалоге и действие block', async () => {
    const user = userEvent.setup()
    mocks.profiles.mockResolvedValue([{ id: 'cp-1', name: 'Коля Иванов' }])
    mocks.act.mockResolvedValue(undefined)

    renderPage()

    await waitFor(() => expect(screen.getByRole('button', { name: 'Заблокировать' })).toBeTruthy())
    await user.click(screen.getByRole('button', { name: 'Заблокировать' }))

    const dialog = await screen.findByRole('dialog')
    expect(mocks.act).not.toHaveBeenCalled()

    await user.type(within(dialog).getByLabelText('Причина (необязательно)'), 'Повторное нарушение')
    await user.click(within(dialog).getByRole('button', { name: 'Заблокировать' }))

    await waitFor(() =>
      expect(mocks.act).toHaveBeenCalledWith('profiles', 'cp-1', 'block', 'Повторное нарушение'),
    )
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

  it('жалоба показывает контекст и закрывается решением', async () => {
    const user = userEvent.setup()
    mocks.profiles.mockResolvedValue([])
    mocks.reports.mockResolvedValue([
      {
        id: 'r-1',
        reason: 'Оскорбление в отзыве',
        comment: 'Мат в третьем абзаце',
        targetType: 'review',
        targetId: 'rv-9',
        createdAt: new Date().toISOString(),
        reporter: { id: 'u-2', fullName: 'Мария Петрова' },
      },
    ])
    mocks.resolveReport.mockResolvedValue(undefined)

    renderPage()

    await user.click(screen.getByRole('tab', { name: 'Жалобы' }))

    await waitFor(() => expect(screen.getByText('Оскорбление в отзыве')).toBeTruthy())
    expect(screen.getByText(/Пожаловался: Мария Петрова/)).toBeTruthy()
    expect(screen.getByText(/Объект: Отзыв rv-9/)).toBeTruthy()
    expect(screen.getByText(/Комментарий: Мат в третьем абзаце/)).toBeTruthy()
    // Действия одобрения контенту жалобам не подходят.
    expect(screen.queryByRole('button', { name: 'Одобрить' })).toBeNull()

    await user.click(screen.getByRole('button', { name: 'Решить' }))

    await waitFor(() => expect(mocks.resolveReport).toHaveBeenCalledWith('r-1', 'resolved'))
  })

  it('жалобу можно отклонить', async () => {
    const user = userEvent.setup()
    mocks.profiles.mockResolvedValue([])
    mocks.reports.mockResolvedValue([{ id: 'r-2', reason: 'Спам', targetType: 'product' }])
    mocks.resolveReport.mockResolvedValue(undefined)

    renderPage()

    await user.click(screen.getByRole('tab', { name: 'Жалобы' }))
    await waitFor(() => expect(screen.getByText('Спам')).toBeTruthy())

    await user.click(screen.getByRole('button', { name: 'Отклонить жалобу' }))

    await waitFor(() => expect(mocks.resolveReport).toHaveBeenCalledWith('r-2', 'rejected'))
  })

  it('очереди переключаются стрелками клавиатуры', async () => {
    const user = userEvent.setup()
    mocks.profiles.mockResolvedValue([])
    mocks.products.mockResolvedValue([])

    renderPage()

    await waitFor(() => expect(mocks.profiles).toHaveBeenCalled())
    await user.click(screen.getByRole('tab', { name: 'Профили' }))
    await user.keyboard('{ArrowRight}')

    await waitFor(() =>
      expect(screen.getByRole('tab', { name: 'Товары' }).getAttribute('aria-selected')).toBe(
        'true',
      ),
    )
  })
})
