// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({ cart: vi.fn(), suggestions: vi.fn() }))

vi.mock('@/shared/api/cart-api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/shared/api/cart-api')>()
  return { ...actual, cartApi: { ...actual.cartApi, get: mocks.cart } }
})
vi.mock('@/shared/api/catalog-api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/shared/api/catalog-api')>()
  return {
    ...actual,
    catalogApi: { ...actual.catalogApi, suggestions: mocks.suggestions },
  }
})

import { useSessionStore } from '@/entities/session/model/session-store'
import { Header } from '@/widgets/header/ui/header'

let client: QueryClient

beforeEach(() => {
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  useSessionStore.getState().clearSession()
  vi.clearAllMocks()
})

afterEach(cleanup)

function CurrentPath() {
  const location = useLocation()
  return <p data-testid="path">{`${location.pathname}${location.search}`}</p>
}

function renderHeader() {
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={['/']}>
        <Header />
        <Routes>
          <Route path="*" element={<CurrentPath />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('Header', () => {
  it('рисует словомарку, поиск и ссылку на избранное', () => {
    mocks.cart.mockResolvedValue(null)

    renderHeader()

    expect(screen.getByRole('link', { name: /kindis/ })).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Избранное' })).toBeTruthy()
    expect(screen.getByRole('combobox', { name: 'Поиск по каталогу' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Найти' })).toBeTruthy()
  })

  it('служебные ссылки ведут на реальные страницы, а не в каталог', () => {
    mocks.cart.mockResolvedValue(null)

    renderHeader()

    const nav = screen.getByRole('navigation', { name: 'Служебная навигация' })
    expect(nav).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Для бизнеса' }).getAttribute('href')).toBe(
      '/for-business',
    )
    expect(screen.getByRole('link', { name: 'Помощь' }).getAttribute('href')).toBe('/help')
    expect(screen.getByRole('link', { name: 'О проекте' }).getAttribute('href')).toBe('/about')
  })

  it('мобильное меню дублирует служебные ссылки с теми же адресами', async () => {
    const user = userEvent.setup()
    mocks.cart.mockResolvedValue(null)

    renderHeader()

    await user.click(screen.getByRole('button', { name: 'Открыть меню' }))

    const mobileNav = screen.getByRole('navigation', { name: 'Мобильная навигация' })
    const forBusiness = within(mobileNav).getByRole('link', { name: 'Для бизнеса' })
    const help = within(mobileNav).getByRole('link', { name: 'Помощь' })
    const about = within(mobileNav).getByRole('link', { name: 'О проекте' })

    expect(forBusiness.getAttribute('href')).toBe('/for-business')
    expect(help.getAttribute('href')).toBe('/help')
    expect(about.getAttribute('href')).toBe('/about')
  })

  it('бургер открывает и закрывает мобильное меню', async () => {
    const user = userEvent.setup()
    mocks.cart.mockResolvedValue(null)

    renderHeader()

    const burger = screen.getByRole('button', { name: 'Открыть меню' })
    expect(burger.getAttribute('aria-expanded')).toBe('false')

    await user.click(burger)

    const opened = screen.getByRole('button', { name: 'Закрыть меню' })
    expect(opened.getAttribute('aria-expanded')).toBe('true')
    expect(screen.getByRole('navigation', { name: 'Мобильная навигация' })).toBeTruthy()

    await user.click(opened)
    expect(screen.queryByRole('navigation', { name: 'Мобильная навигация' })).toBeNull()
  })

  it('Escape закрывает открытое меню', async () => {
    const user = userEvent.setup()
    mocks.cart.mockResolvedValue(null)

    renderHeader()

    await user.click(screen.getByRole('button', { name: 'Открыть меню' }))
    expect(screen.getByRole('navigation', { name: 'Мобильная навигация' })).toBeTruthy()

    await user.keyboard('{Escape}')

    expect(screen.queryByRole('navigation', { name: 'Мобильная навигация' })).toBeNull()
  })

  it('отправка поиска ведёт на страницу результатов', async () => {
    const user = userEvent.setup()
    mocks.cart.mockResolvedValue(null)
    mocks.suggestions.mockResolvedValue([])

    renderHeader()

    await user.type(screen.getByRole('combobox', { name: 'Поиск по каталогу' }), 'серьги')
    await user.click(screen.getByRole('button', { name: 'Найти' }))

    await waitFor(() =>
      expect(screen.getByTestId('path').textContent).toBe(
        '/search?q=%D1%81%D0%B5%D1%80%D1%8C%D0%B3%D0%B8',
      ),
    )
  })
})
