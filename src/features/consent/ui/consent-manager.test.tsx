// @vitest-environment jsdom
import { act, cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { ConsentManager } from '@/features/consent/ui/consent-manager'
import type { ChildProfile } from '@/shared/api/children-api'

afterEach(cleanup)

interface MutateOptions {
  onSuccess?: () => void
  onError?: (error: Error) => void
}

function makeMutation() {
  return {
    mutate: vi.fn((_childId: string, _options?: MutateOptions) => undefined),
    isPending: false,
  }
}

function makeProfile(overrides: Partial<ChildProfile> = {}): ChildProfile {
  return {
    id: 'cp-1',
    userId: 'u-1',
    slug: 'anya',
    name: 'Аня',
    age: 10,
    city: null,
    avatar: null,
    about: null,
    status: 'active',
    hasDisability: false,
    disabilityVerified: false,
    disabilityConsentAt: null,
    consentDocumentVersion: null,
    ...overrides,
  }
}

function renderManager(profiles: ChildProfile[]) {
  const grant = makeMutation()
  const revoke = makeMutation()
  render(<ConsentManager profiles={profiles} grant={grant} revoke={revoke} />)
  return { grant, revoke }
}

describe('ConsentManager', () => {
  it('бейдж и кнопки зависят от disabilityConsentAt, а не от hasDisability', () => {
    const { grant } = renderManager([
      makeProfile({ id: 'cp-1', name: 'Аня', hasDisability: true }),
      makeProfile({
        id: 'cp-2',
        name: 'Коля',
        hasDisability: false,
        disabilityConsentAt: '2026-11-12T10:00:00Z',
      }),
    ])

    // Инвалидность есть, а согласие сервер ещё не зафиксировал.
    expect(screen.getByText('Согласие не дано')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Согласен' })).toBeTruthy()
    // Согласие зафиксировано сервером — решает только disabilityConsentAt.
    expect(screen.getByText('Согласие дано')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Отозвать согласие' })).toBeTruthy()
    expect(grant.mutate).not.toHaveBeenCalled()
  })

  it('сообщение об успехе появляется только после ответа сервера', async () => {
    const user = userEvent.setup()
    const { grant } = renderManager([makeProfile({ id: 'cp-1', name: 'Аня' })])

    await user.click(screen.getByRole('button', { name: 'Согласен' }))

    expect(grant.mutate).toHaveBeenCalledWith(
      'cp-1',
      expect.objectContaining({ onSuccess: expect.any(Function) }),
  	)
  	// До ответа сервера успех не показываем.
  	expect(screen.queryByText('Согласие для «Аня» сохранено.')).toBeNull()

  	const options = grant.mutate.mock.calls[0][1]
  	act(() => options?.onSuccess?.())

  	expect(screen.getByText('Согласие для «Аня» сохранено.')).toBeTruthy()
	})

	it('при ошибке сервера показывает сообщение об ошибке', async () => {
	  const user = userEvent.setup()
	  const { grant } = renderManager([makeProfile({ id:'cp-1', name:'Аня' })])

	  await user.click(screen.getByRole('button', { name:'Согласен' }))
	  const options = grant.mutate.mock.calls[0][1]
	  act(() => options?.onError?.(new Error('Версия согласия устарела')))

	  expect(screen.queryByText('Согласие для «Аня» сохранено.')).toBeNull()
	  expect(screen.getByRole('alert').textContent).toBe('Версия согласия устарела')
	})


  it('отзыв через диалог сообщает об успехе только после ответа сервера', async () => {
    const user = userEvent.setup()
    const { revoke } = renderManager([
      makeProfile({
        id: 'cp-2',
        name: 'Коля',
        disabilityConsentAt: '2026-11-12T10:00:00Z',
      }),
    ])

    await user.click(screen.getByRole('button', { name: 'Отозвать согласие' }))
    await user.click(screen.getByRole('button', { name: 'Отозвать' }))

    expect(revoke.mutate).toHaveBeenCalledWith(
      'cp-2',
      expect.objectContaining({ onSuccess: expect.any(Function) }),
    )
    expect(screen.queryByText('Согласие для «Коля» отозвано.')).toBeNull()

    const options = revoke.mutate.mock.calls[0][1]
    act(() => options?.onSuccess?.())

    expect(screen.getByText('Согласие для «Коля» отозвано.')).toBeTruthy()
  })

  it('без профилей показывает подсказку вместо списка', () => {
    renderManager([])

    expect(
      screen.getByText(
        'Профилей ребёнка пока нет. Согласие оформляется вместе с профилем в личном кабинете.',
      ),
    ).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Согласен' })).toBeNull()
  })
})
