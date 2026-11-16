// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// Тяжёлые формы настроек мокаем — страница отвечает только за сборку секций.
vi.mock('@/features/profile/ui/profile-form', () => ({
  ProfileForm: ({ user, onSaved }: { user: { email: string }; onSaved: (v: unknown) => void }) => (
    <button type="button" onClick={() => onSaved({ fullName: 'Новое имя' })}>
      Сохранить профиль {user.email}
    </button>
  ),
}))
vi.mock('@/features/profile/ui/address-book', () => ({
  AddressBook: () => <p>Адресная книга</p>,
}))
vi.mock('@/features/profile/ui/password-form', () => ({
  PasswordForm: () => <p>Форма смены пароля</p>,
}))
vi.mock('@/features/accessibility/ui/a11y-controls', () => ({
  AccessibilityControls: () => <p>Настройки доступности</p>,
}))

import { useSessionStore } from '@/entities/session/model/session-store'
import ProfileSettingsPage from '@/pages/cabinet/ui/profile-settings-page'

beforeEach(() => {
  useSessionStore.getState().clearSession()
})

afterEach(cleanup)

describe('ProfileSettingsPage', () => {
  it('без сессии ничего не рендерит', () => {
    const { container } = render(
      <MemoryRouter>
        <ProfileSettingsPage />
      </MemoryRouter>,
    )

    expect(container.innerHTML).toBe('')
  })

  it('собирает все секции настроек', () => {
    useSessionStore.getState().setSession({
      id: 'u-1',
      email: 'parent@example.com',
      fullName: 'Мама',
      phone: null,
      city: 'Москва',
      role: 'parent',
    })

    render(
      <MemoryRouter>
        <ProfileSettingsPage />
      </MemoryRouter>,
    )

    expect(screen.getByText('Настройки профиля')).toBeTruthy()
    expect(screen.getByText('Личные данные')).toBeTruthy()
    expect(screen.getByText('Доступность')).toBeTruthy()
    expect(screen.getByText('Адреса доставки')).toBeTruthy()
    expect(screen.getByText('Смена пароля')).toBeTruthy()
    expect(screen.getByRole('button', { name: /Сохранить профиль parent@example.com/ })).toBeTruthy()
  })

  it('сохранение профиля обновляет пользователя в сессии', async () => {
    const user = userEvent.setup()
    useSessionStore.getState().setSession({
      id: 'u-1',
      email: 'parent@example.com',
      fullName: 'Мама',
      phone: null,
      city: 'Москва',
      role: 'parent',
    })

    render(
      <MemoryRouter>
        <ProfileSettingsPage />
      </MemoryRouter>,
    )

    await user.click(screen.getByRole('button', { name: /Сохранить профиль/ }))

    expect(useSessionStore.getState().user?.fullName).toBe('Новое имя')
  })
})