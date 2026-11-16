// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({ audit: vi.fn() }))

vi.mock('@/shared/api/admin-api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/shared/api/admin-api')>()
  return { ...actual, adminApi: { ...actual.adminApi, audit: mocks.audit } }
})

import AdminAuditPage from '@/pages/admin/ui/admin-audit-page'

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
        <AdminAuditPage />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('AdminAuditPage', () => {
  it('во время загрузки показывает скелетон', () => {
    mocks.audit.mockReturnValue(new Promise(() => {}))

    renderPage()

    expect(screen.queryByText('Аудит спецданных')).toBeNull()
  })

  it('при ошибке показывает предупреждение', async () => {
    mocks.audit.mockRejectedValue(new Error('сеть'))

    renderPage()

    await waitFor(() => expect(screen.getByRole('alert')).toBeTruthy())
    expect(screen.getByText('Попробуйте обновить страницу.')).toBeTruthy()
  })

  it('без записей пишет, что обращений не было', async () => {
    mocks.audit.mockResolvedValue([])

    renderPage()

    await waitFor(() =>
      expect(screen.getByText('Обращений к спецданным пока не было.')).toBeTruthy(),
    )
  })

  it('рисует таблицу обращений с актором и объектом', async () => {
    mocks.audit.mockResolvedValue([
      {
        id: 'r-1',
        action: 'read',
        entityType: 'child_profile',
        entityId: 'abcdef123456',
        createdAt: '2026-11-01T10:00:00Z',
        actor: { email: 'admin@example.com', fullName: 'Админ' },
      },
      {
        id: 'r-2',
        action: 'export',
        entityType: 'order',
        entityId: 'zzzzzz999999',
        createdAt: '2026-11-02T10:00:00Z',
        actor: null,
      },
    ])

    renderPage()

    await waitFor(() => expect(screen.getByRole('table')).toBeTruthy())
    expect(screen.getByText('Админ')).toBeTruthy()
    expect(screen.getByText('—')).toBeTruthy()
    expect(screen.getByText('child_profile/abcdef12')).toBeTruthy()
    expect(mocks.audit).toHaveBeenCalledWith({ limit: 200 })
  })
})
