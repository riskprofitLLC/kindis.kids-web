// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'

// Каталог и подсказки приходят из сети — на URL их наличие не влияет.
vi.mock('@/features/catalog/model/use-catalog', () => ({
  useCatalog: () => ({ data: undefined, isPending: false, isError: false }),
}))
vi.mock('@/features/search/model/use-suggestions', () => ({
  useSuggestions: () => ({ data: [] }),
}))

import SearchPage from '@/pages/search/ui/search-page'

afterEach(cleanup)

function CurrentSearch() {
  return <p data-testid="search">{useLocation().search}</p>
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/search']}>
      <Routes>
        {/* Зонд адреса живёт на том же маршруте — видит обновления URL */}
        <Route
          path="/search"
          element={
            <>
              <SearchPage />
              <CurrentSearch />
            </>
          }
        />
      </Routes>
    </MemoryRouter>,
  )
}

describe('SearchPage', () => {
  it('отправка запроса пишет его в URL единственным механизмом', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.type(screen.getByLabelText('Поиск по каталогу'), 'бусы')
    await user.click(screen.getByRole('button', { name: 'Найти' }))

    // Параметр q встречается в адресе ровно один раз — без двойного navigate.
    const search = screen.getByTestId('search').textContent ?? ''
    expect(search).toBe(`?q=${encodeURIComponent('бусы')}`)
    expect(search.match(/[?&]q=/g)).toHaveLength(1)
    expect(await screen.findByText(/Результаты по запросу «бусы»/)).toBeTruthy()
  })

  it('пустый запрос не трогает адрес', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(screen.getByRole('button', { name: 'Найти' }))

    expect(screen.getByTestId('search').textContent).toBe('')
  })
})