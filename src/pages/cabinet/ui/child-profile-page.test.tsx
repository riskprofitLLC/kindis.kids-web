// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({ mine: vi.fn(), media: vi.fn() }))

vi.mock('@/shared/api/children-api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/shared/api/children-api')>()
  return {
    ...actual,
    childrenApi: { ...actual.childrenApi, mine: mocks.mine, media: mocks.media },
  }
})

// Медиа и предпросмотр покрываются своими спеками — здесь только сборка страницы.
vi.mock('@/features/child-profile/ui/profile-editor', () => ({
  ProfileEditor: ({ profile }: { profile: { name: string } | null }) => (
    <p>Редактор профиля: {profile ? profile.name : 'новый'}</p>
  ),
}))
vi.mock('@/features/child-profile/ui/media-uploader', () => ({
  MediaUploader: ({ ownerId, kind }: { ownerId: string; kind: string }) => (
    <p>
      Загрузка {kind} для {ownerId}
    </p>
  ),
}))
vi.mock('@/features/child-profile/ui/media-gallery', () => ({
  MediaGallery: ({ ownerId, kind }: { ownerId: string; kind: string }) => (
    <p>
      Галерея {kind} для {ownerId}
    </p>
  ),
}))
vi.mock('@/pages/cabinet/ui/public-preview', () => ({
  PublicPreview: ({ profile }: { profile: { name: string } }) => <p>Предпросмотр {profile.name}</p>,
}))

import ChildProfilePage from '@/pages/cabinet/ui/child-profile-page'

let client: QueryClient

beforeEach(() => {
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  vi.clearAllMocks()
})

afterEach(cleanup)

function renderPage() {
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <ChildProfilePage />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('ChildProfilePage', () => {
  it('во время загрузки рисует скелетоны', () => {
    mocks.mine.mockReturnValue(new Promise(() => {}))

    renderPage()

    expect(screen.queryByText('Профиль ребёнка')).toBeNull()
  })

  it('при ошибке показывает предупреждение', async () => {
    mocks.mine.mockRejectedValue(new Error('сеть'))

    renderPage()

    await waitFor(() =>
      expect(screen.getByText('Не удалось загрузить профиль. Обновите страницу.')).toBeTruthy(),
    )
  })

  it('без профиля показывает только редактор создания', async () => {
    mocks.mine.mockResolvedValue([])

    renderPage()

    await waitFor(() => expect(screen.getByText('Профиль ребёнка')).toBeTruthy())
    expect(screen.getByText('Редактор профиля: новый')).toBeTruthy()
    expect(screen.queryByText('Фото профиля')).toBeNull()
    expect(mocks.media).not.toHaveBeenCalled()
  })

  it('с профилем-черновиком показывает статус, счётчики медиа и предпросмотр', async () => {
    mocks.mine.mockResolvedValue([
      {
        id: 'cp-1',
        userId: 'u-1',
        slug: 'kolya',
        name: 'Коля',
        age: 11,
        city: null,
        avatar: null,
        about: null,
        status: 'draft',
        hasDisability: false,
        disabilityVerified: false,
        disabilityConsentAt: null,
        consentDocumentVersion: null,
      },
    ])
    mocks.media.mockResolvedValue([
      { id: 'a-1', kind: 'photo', status: 'ready' },
      { id: 'a-2', kind: 'photo', status: 'ready' },
      { id: 'a-3', kind: 'video', status: 'ready' },
    ])

    renderPage()

    await waitFor(() => expect(screen.getByText(/Профиль — черновик/)).toBeTruthy())
    expect(screen.getByText('Фото профиля')).toBeTruthy()
    await waitFor(() =>
      expect(
        screen.getByText(
          (_content, element) => element?.tagName === 'SPAN' && element.textContent === '2 из 5',
        ),
      ).toBeTruthy(),
    )
    expect(screen.getByText('Видео «Как он делает»')).toBeTruthy()
    expect(screen.getByText('Загрузка photo для cp-1')).toBeTruthy()
    expect(screen.getByText('Галерея video для cp-1')).toBeTruthy()
    expect(screen.getByText('Предпросмотр Коля')).toBeTruthy()
  })
})
