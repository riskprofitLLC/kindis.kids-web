// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  reverseGeocode: vi.fn(),
}))

// Карту в jsdom не строим — замоканным компонентом рулим выбором точки.
vi.mock('@/features/map/ui/location-map', () => ({
  default: ({ onPick }: { onPick?: (lat: number, lng: number) => void }) => (
    <button type="button" onClick={() => onPick?.(43.6, 39.7)}>
      Клик по карте
    </button>
  ),
}))

vi.mock('@/features/map/lib/reverse-geocode', () => ({
  reverseGeocode: (...args: unknown[]) => mocks.reverseGeocode(...args),
}))

import { LocationPicker, type LocationValue } from '@/features/map/ui/location-picker'

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

// Управляемая обёртка:как в форме,значение живёт в состоянии родителя.
function ControlledPicker({ initial }: { initial?: LocationValue }) {
  const [value, setValue] = useState<LocationValue>(
    initial ?? { address: '', latitude: null, longitude: null },
  )
  return <LocationPicker value={value} onChange={setValue} />
}

describe('LocationPicker', () => {
  it('адрес вводится вручную', async () => {
    const user = userEvent.setup()
    render(<ControlledPicker />)

    await user.type(screen.getByLabelText('Адрес'), 'Сочи')

    expect((screen.getByLabelText('Адрес') as HTMLInputElement).value).toBe('Сочи')
  })

  it('клик по карте подставляет адрес из геокодирования', async () => {
    mocks.reverseGeocode.mockResolvedValue('Сочи, улица Ленина, 10')
    const user = userEvent.setup()
    render(<ControlledPicker />)

    await user.click(screen.getByRole('button', { name: 'Клик по карте' }))

    await waitFor(() =>
      expect((screen.getByLabelText('Адрес') as HTMLInputElement).value).toBe(
        'Сочи, улица Ленина, 10',
      ),
    )
    expect(screen.getByText(/Точка:43.60000/)).toBeTruthy()
  })

  it('сбой геокодирования просит ввести адрес вручную', async () => {
    mocks.reverseGeocode.mockResolvedValue(null)
    const user = userEvent.setup()
    render(<ControlledPicker />)

    await user.click(screen.getByRole('button', { name: 'Клик по карте' }))

    await waitFor(() =>
      expect(screen.getByRole('alert').textContent).toMatch(/введите его вручную/),
    )
  })

  it('ручной адрес не перезаписывается автоподстановкой', async () => {
    mocks.reverseGeocode.mockResolvedValue('Сочи, улица Ленина, 10')
    const user = userEvent.setup()
    render(<ControlledPicker />)

    await user.type(screen.getByLabelText('Адрес'), 'Мой адрес')
    await user.click(screen.getByRole('button', { name: 'Клик по карте' }))

    await waitFor(() => expect(screen.getByText(/Точка:43.60000/)).toBeTruthy())
    expect((screen.getByLabelText('Адрес') as HTMLInputElement).value).toBe('Мой адрес')
    expect(mocks.reverseGeocode).not.toHaveBeenCalled()
  })

  it('сброс места обнуляет точку и адрес', async () => {
    const user = userEvent.setup()
    render(<ControlledPicker initial={{ address: 'Сочи', latitude: 43.6, longitude: 39.7 }} />)

    await user.click(screen.getByRole('button', { name: 'Сбросить место' }))

    expect((screen.getByLabelText('Адрес') as HTMLInputElement).value).toBe('')
    expect(screen.getByText(/Точка не выбрана/)).toBeTruthy()
  })
})
