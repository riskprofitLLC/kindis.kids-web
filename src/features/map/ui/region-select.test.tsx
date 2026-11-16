// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { RegionSelect } from '@/features/map/ui/region-select'

// Без globals RTL не чистит DOM сам — делаем это вручную между тестами.
afterEach(cleanup)

describe('RegionSelect', () => {
  it('показывает выбранный регион', () => {
    render(<RegionSelect value="Москва" onChange={vi.fn()} />)

    const select = screen.getByRole('combobox') as HTMLSelectElement
    expect(select.value).toBe('Москва')
  })

  it('пустое значение значит все регионы', () => {
    render(<RegionSelect value="" onChange={vi.fn()} />)

    const select = screen.getByRole('combobox') as HTMLSelectElement
    expect(select.value).toBe('')
  })

  it('выбор города отдаёт наружу', async () => {
    const onChange = vi.fn()
    render(<RegionSelect value="" onChange={onChange} />)

    await userEvent.selectOptions(screen.getByRole('combobox'), 'Сочи')

    expect(onChange).toHaveBeenCalledWith('Сочи')
  })

  it('возврат к всем регионам отдаёт null', async () => {
    const onChange = vi.fn()
    render(<RegionSelect value="Сочи" onChange={onChange} />)

    await userEvent.selectOptions(screen.getByRole('combobox'), '')

    expect(onChange).toHaveBeenCalledWith(null)
  })

  it('«Ближайшие ко мне» при отказе геолокации показывает плейсхолдер', async () => {
    const getCurrentPosition = vi.fn((_success, failure) =>
      failure?.({ code: 1, message: 'denied' } as GeolocationPositionError),
    )
    vi.stubGlobal('navigator', {
      ...navigator,
      geolocation: { getCurrentPosition },
    })

    render(<RegionSelect value="" onChange={vi.fn()} />)

    await userEvent.selectOptions(screen.getByRole('combobox'), '__near__')

    expect(getCurrentPosition).toHaveBeenCalled()
    expect(screen.getByText(/Геолокация недоступна/)).toBeTruthy()

    vi.unstubAllGlobals()
  })

  it('«Ближайшие ко мне» с доступной геолокацией выбирает ближайший город', async () => {
    const getCurrentPosition = vi.fn((success) =>
      success?.({
        coords: { latitude: 55.75, longitude: 37.62 },
      } as GeolocationPosition),
    )
    vi.stubGlobal('navigator', {
      ...navigator,
      geolocation: { getCurrentPosition },
    })
    const onChange = vi.fn()

    render(<RegionSelect value="" onChange={onChange} />)
    await userEvent.selectOptions(screen.getByRole('combobox'), '__near__')

    expect(onChange).toHaveBeenCalledWith('Москва')

    vi.unstubAllGlobals()
  })
})