// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

// maplibre в jsdom не поднимается — карту замокиваем, проверяем обвязку блока.
vi.mock('@/features/map/ui/product-location-map', () => ({
  default: ({ latitude, longitude }: { latitude: number; longitude: number }) => (
    <div data-testid="mini-map">{`${latitude}:${longitude}`}</div>
  ),
}))

import { ProductLocation } from '@/features/map/ui/product-location'

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('ProductLocation', () => {
  it('без адреса и координат блок не рендерится', () => {
    const { container } = render(<ProductLocation />)

    expect(container.innerHTML).toBe('')
  })

  it('показывает адрес и мини-карту с маркером', async () => {
    render(<ProductLocation address="Сочи, улица Ленина, 10" latitude={43.6} longitude={39.7} />)

    expect(screen.getByText('Сочи, улица Ленина, 10')).toBeTruthy()
    expect((await screen.findByTestId('mini-map')).textContent).toBe('43.6:39.7')
    expect(screen.getByRole('link', { name: 'Открыть в OpenStreetMap' })).toBeTruthy()
  })

  it('только адрес без точки — подпись вместо карты', () => {
    render(<ProductLocation address="Сочи" />)

    expect(screen.getByText(/Точку на карте продавец не указал/)).toBeTruthy()
    expect(screen.queryByTestId('mini-map')).toBeNull()
  })
})
