// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { CatalogFiltersPanel } from '@/features/catalog/ui/catalog-filters-panel'
import type { CategoryNode } from '@/shared/api/catalog-api'
import type { CatalogFilters } from '@/shared/domain/catalog'

afterEach(cleanup)

const categories: CategoryNode[] = [
  {
    id: 'c-1',
    name: 'Украшения',
    slug: 'ukrasheniya',
    children: [],
  },
]

const facets = {
  categories: [{ slug: 'ukrasheniya', name: 'Украшения', count: 7 }],
  cities: [{ city: 'Казань', count: 4 }],
  ageBuckets: [
    { label: 'до 7 лет', fromAge: null, toAge: 6, count: 3 },
    { label: '7–10 лет', fromAge: 7, toAge: 10, count: 5 },
    { label: '11–14 лет', fromAge: 11, toAge: null, count: 2 },
  ],
}

function renderPanel(filters: CatalogFilters, onChange = vi.fn(), onReset = vi.fn()) {
  return {
    onChange,
    onReset,
    ...render(
      <CatalogFiltersPanel
        filters={filters}
        facets={facets}
        categories={categories}
        onChange={onChange}
        onReset={onReset}
      />,
    ),
  }
}

describe('CatalogFiltersPanel', () => {
  it('чипс категории показывает название, а не slug', () => {
    renderPanel({ categorySlug: 'ukrasheniya' })

    expect(screen.getByText('Категория: Украшения')).toBeTruthy()
    expect(screen.queryByText('Категория: ukrasheniya')).toBeNull()
  })

  it('возрастная группа уходит в фильтр границами бакета', async () => {
    const user = userEvent.setup()
    const { onChange } = renderPanel({})

    await user.click(screen.getByLabelText(/7–10 лет/))

    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ ageFrom: 7, ageTo: 10 }))
  })

  it('город из подсказок фасетов уходит в фильтр', async () => {
    const user = userEvent.setup()
    const { onChange } = renderPanel({})

    await user.click(screen.getByRole('button', { name: /Казань/ }))

    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ city: 'Казань' }))
  })

  it('приоритетный мастер включается чекбоксом', async () => {
    const user = userEvent.setup()
    const { onChange } = renderPanel({})

    await user.click(screen.getByLabelText('Приоритетные мастера'))

    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ priorityOnly: true }))
  })
})
