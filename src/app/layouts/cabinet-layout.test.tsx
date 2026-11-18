// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, render, screen, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, describe, expect, it } from 'vitest'

import { CabinetLayout } from '@/app/layouts/cabinet-layout'
import { useSessionStore } from '@/entities/session/model/session-store'
import type { UserRole } from '@/shared/domain/user'

afterEach(cleanup)

function setRole(role: UserRole) {
  useSessionStore.getState().setSession({
    id: 'u-1',
    email: 'parent@example.com',
    fullName: 'Мария',
    phone: null,
    city: null,
    role,
  })
}

function renderCabinet() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={['/cabinet']}>
        <Routes>
          <Route path="/cabinet" element={<CabinetLayout />}>
            <Route index element={<p>Содержимое кабинета</p>} />
          </Route>
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('CabinetLayout', () => {
  it('покупателю показывает только его пункты в обеих навигациях', () => {
    setRole('buyer')
    renderCabinet()

    for (const label of ['Навигация кабинета', 'Навигация кабинета мобильная']) {
      const nav = screen.getByRole('navigation', { name: label })
      expect(within(nav).getByRole('link', { name: 'Обзор' }).getAttribute('href')).toBe('/cabinet')
      expect(within(nav).getByRole('link', { name: 'Заказы' })).toBeTruthy()
      expect(within(nav).getByRole('link', { name: 'Избранное' })).toBeTruthy()
      expect(within(nav).getByRole('link', { name: 'Профиль' })).toBeTruthy()
      expect(within(nav).queryByRole('link', { name: 'Профиль ребёнка' })).toBeNull()
      expect(within(nav).queryByRole('link', { name: 'Модерация' })).toBeNull()
    }
  })

  it('родителю добавляет пункты продавца', () => {
    setRole('parent')
    renderCabinet()

    for (const label of ['Навигация кабинета', 'Навигация кабинета мобильная']) {
      const nav = screen.getByRole('navigation', { name: label })
      expect(within(nav).getByRole('link', { name: 'Профиль ребёнка' }).getAttribute('href')).toBe(
        '/cabinet/child-profile',
      )
      expect(within(nav).getByRole('link', { name: 'Мои товары' }).getAttribute('href')).toBe(
        '/cabinet/products',
      )
      expect(within(nav).getByRole('link', { name: 'Заказы продавца' })).toBeTruthy()
      expect(within(nav).getByRole('link', { name: 'Аналитика' })).toBeTruthy()
      expect(within(nav).getByRole('link', { name: 'Чаты' })).toBeTruthy()
    }
  })

  it('админу показывает отдельную группу администрирования', () => {
    setRole('admin')
    renderCabinet()

    for (const label of ['Навигация кабинета', 'Навигация кабинета мобильная']) {
      const nav = screen.getByRole('navigation', { name: label })
      expect(within(nav).getByText('Администрирование')).toBeTruthy()
      expect(within(nav).getByRole('link', { name: 'Модерация' }).getAttribute('href')).toBe(
        '/admin/moderation',
      )
      expect(within(nav).getByRole('link', { name: 'Категории' })).toBeTruthy()
      expect(within(nav).getByRole('link', { name: 'Атрибуты' })).toBeTruthy()
      expect(within(nav).getByRole('link', { name: 'Аудит' })).toBeTruthy()
      expect(within(nav).queryByRole('link', { name: 'Обзор' })).toBeNull()
    }
  })

  it('мобильный вариант рендерится и содержимое кабинета на месте', () => {
    setRole('parent')
    renderCabinet()

    expect(screen.getByRole('navigation', { name: 'Навигация кабинета мобильная' })).toBeTruthy()
    expect(screen.getByText('Содержимое кабинета')).toBeTruthy()
  })
})
