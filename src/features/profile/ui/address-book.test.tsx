// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { AddressBook } from '@/features/profile/ui/address-book'
import { storage } from '@/shared/lib/storage/web-storage'

const KEY = 'kindis-addresses'

beforeEach(() => {
  storage.removeItem(KEY)
})

afterEach(cleanup)

describe('AddressBook', () => {
  it('не добавляет адрес без обязательных полей и показывает ошибки', async () => {
    const user = userEvent.setup()
    render(<AddressBook />)

    await user.click(screen.getByRole('button', { name: 'Добавить адрес' }))

    expect(await screen.findByText('Укажите название')).toBeTruthy()
    expect(screen.getByText('Укажите город')).toBeTruthy()
    expect(screen.getByText('Укажите улицу')).toBeTruthy()
    expect(screen.getByText('Укажите дом')).toBeTruthy()
    expect(storage.getItem(KEY)).toBeNull()
  })

  it('индекс принимает только шесть цифр', async () => {
    const user = userEvent.setup()
    render(<AddressBook />)

    await user.type(screen.getByLabelText('Название'), 'Дом')
    await user.type(screen.getByLabelText('Город'), 'Москва')
    await user.type(screen.getByLabelText('Улица'), 'Тверская')
    await user.type(screen.getByLabelText('Дом'), '1')
    await user.type(screen.getByLabelText('Индекс'), '123')
    await user.click(screen.getByRole('button', { name: 'Добавить адрес' }))

    expect(await screen.findByText('Индекс — 6 цифр')).toBeTruthy()
    expect(storage.getItem(KEY)).toBeNull()
  })

  it('корректный адрес попадает в список и хранилище，поля очищаются', async () => {
    const user = userEvent.setup()
    render(<AddressBook />)

    await user.type(screen.getByLabelText('Название'), 'Дача')
    await user.type(screen.getByLabelText('Город'), 'Сочи')
    await user.type(screen.getByLabelText('Улица'), 'Курортная')
    await user.type(screen.getByLabelText('Дом'), '7')
    await user.type(screen.getByLabelText('Индекс'), '354000')
    await user.click(screen.getByRole('button', { name: 'Добавить адрес' }))

    await waitFor(() =>
      expect(screen.getByText(/Дача: Сочи, Курортная, 7/)).toBeTruthy(),
    )
    expect((screen.getByLabelText('Название') as HTMLInputElement).value).toBe('')
    expect((screen.getByLabelText('Индекс') as HTMLInputElement).value).toBe('')

    const saved = JSON.parse(storage.getItem(KEY) ?? '[]')
    expect(saved).toHaveLength(1)
    expect(saved[0]).toMatchObject({ city: 'Сочи', zip: '354000' })
  })

  it('квартира и индекс необязательны', async () => {
    const user = userEvent.setup()
    render(<AddressBook />)

    await user.type(screen.getByLabelText('Название'), 'Работа')
    await user.type(screen.getByLabelText('Город'), 'Казань')
    await user.type(screen.getByLabelText('Улица'), 'Баумана')
    await user.type(screen.getByLabelText('Дом'), '10')
    await user.click(screen.getByRole('button', { name: 'Добавить адрес' }))

    await waitFor(() => expect(screen.queryByText('Индекс — 6 цифр')).toBeNull())
    expect(screen.queryByText('Укажите индекс')).toBeNull()
    expect(JSON.parse(storage.getItem(KEY) ?? '[]')).toHaveLength(1)
  })
})