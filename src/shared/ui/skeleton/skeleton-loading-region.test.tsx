// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { Skeleton } from '@/shared/ui/skeleton/skeleton'
import { LoadingRegion } from '@/shared/ui/skeleton/skeleton-loading-region'

afterEach(cleanup)

describe('LoadingRegion', () => {
  it('помечает контейнер загрузки и озвучивает её скринридеру', () => {
    const { container } = render(
      <LoadingRegion>
        <Skeleton className="h-24 w-full" />
      </LoadingRegion>,
    )

    const region = screen.getByText('Загружаем…').parentElement
    expect(region?.getAttribute('aria-busy')).toBe('true')
    // Скелетон внутри остаётся декоративным.
    expect(container.querySelector('[aria-hidden="true"]')).not.toBeNull()
  })
})