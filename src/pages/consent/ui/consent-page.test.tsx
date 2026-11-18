// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  mine: vi.fn(),
  grantConsent: vi.fn(),
  revokeConsent: vi.fn(),
}))

vi.mock('@/shared/api/children-api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/shared/api/children-api')>()
  return {
    ...actual,
    childrenApi: { ...actual.childrenApi, ...mocks },
  }
})

import { useSessionStore } from '@/entities/session/model/session-store'
import ConsentPage from '@/pages/consent/ui/consent-page'

let client: QueryClient

beforeEach(() => {
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  vi.clearAllMocks()
})

afterEach(cleanup)

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

function renderPage() {
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <ConsentPage />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

const profile = {
  id: 'cp-1',
  userId: 'u-1',
  slug: 'anya',
  name: 'Аня',
  age: 10,
  city: null,
  avatar: null,
  about: null,
  status: 'active',
  hasDisability: false,
  disabilityVerified: false,
  disabilityConsentAt: null,
  consentDocumentVersion: null,
}

describe('ConsentPage', () => {
  it('гостю показывает текст согласия и предложение войти', () => {
    useSessionStore.getState().clearSession()
    mocks.mine.mockResolvedValue([])

    renderPage()

    expect(screen.getByText('Согласие на обработку специальных данных')).toBeTruthy()
    expect(screen.getByText(/Чтобы дать или отозвать согласие/)).toBeTruthy()
    expect(mocks.mine).not.toHaveBeenCalled()
  	expect(screen.queryByRole('button', { name:'Согласен' })).toBeNull()
	})

	it('сообщение об успехе приходит только после ответа сервера', async () => {
	  const user = userEvent.setup()
	  authenticate()
	  mocks.mine.mockResolvedValue([profile])
	  let resolveGrant: (value: unknown) => void = () => undefined
	  mocks.grantConsent.mockReturnValue(
	    new Promise((resolve) => {
	      resolveGrant = resolve as (value: unknown) => void
	    }),
	  )

	  renderPage()

	  const button = await waitFor(() => screen.getByRole('button', { name:'Согласен' }))
	  await user.click(button)

	  // Запрос ушёл, но ответа сервера ещё нет — успех не показываем.
	  expect(mocks.grantConsent).toHaveBeenCalledWith('cp-1', '1.0')
	  expect(screen.queryByText('Согласие для «Аня» сохранено.')).toBeNull()

	  await act(async () => {
	    resolveGrant({ ...profile, disabilityConsentAt:'2026-11-12T10:00:00Z' })
	    await Promise.resolve()
	  })

	  expect(screen.getByText('Согласие для «Аня» сохранено.')).toBeTruthy()
	})
})
