// @vitest-environment jsdom
import { act, cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { OfflineBanner } from '@/widgets/offline-banner/ui/offline-banner'

afterEach(cleanup)

describe('OfflineBanner', () => {
  it('в сети баннера нет', () => {
    Object.defineProperty(navigator, 'onLine', { value: true, configurable: true })

    render(<OfflineBanner />)

    expect(screen.queryByRole('status')).toBeNull()
  })

  it('при офлайне показывает предупреждение', () => {
    Object.defineProperty(navigator, 'onLine', { value: false, configurable: true })

    render(<OfflineBanner />)

    expect(screen.getByRole('status').textContent).toContain('Нет связи')
  })

  it('реагирует на события offline и online', () => {
    Object.defineProperty(navigator, 'onLine', { value: true, configurable: true })

    render(<OfflineBanner />)
    expect(screen.queryByRole('status')).toBeNull()

    act(() => window.dispatchEvent(new Event('offline')))
    expect(screen.getByRole('status')).toBeTruthy()

    act(() => window.dispatchEvent(new Event('online')))
    expect(screen.queryByRole('status')).toBeNull()
  })
})
