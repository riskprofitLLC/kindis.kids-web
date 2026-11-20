import { beforeEach, describe, expect, it, vi } from 'vitest'

// Профили детей зовут GET/POST/PATCH/DELETE клиента — мокаем весь набор.
const get = vi.fn()
const post = vi.fn()
const patch = vi.fn()
const del = vi.fn()

vi.mock('@/shared/api/client', () => ({
  api: {
    get: (...args: unknown[]) => get(...args),
    post: (...args: unknown[]) => post(...args),
    patch: (...args: unknown[]) => patch(...args),
    delete: (...args: unknown[]) => del(...args),
  },
}))

const { childrenApi } = await import('@/shared/api/children-api')

function child(overrides: Record<string, unknown> = {}) {
  return {

    id: 'chd_1',
    userId: 'usr_1',
    slug: 'masha',
    name: 'Маша',
    age: 7,
    city: 'Казань',
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

beforeEach(() => {
  vi.clearAllMocks()
})

describe('childrenApi.mine', () => {
  it('возвращает профили владельца без изменений', async () => {
    const profiles = [child(), child({ id: 'chd_2' })]
    get.mockResolvedValueOnce({ data: profiles })

    await expect(childrenApi.mine()).resolves.toEqual(profiles)
    expect(get).toHaveBeenCalledWith('/children/mine')
  })
})

describe('childrenApi.create', () => {
  it('создаёт профиль и возвращает его', async () => {
    const created = child({ id: 'chd_3' })
    post.mockResolvedValueOnce({ data: created })

    const input = { name: 'Маша', age: 7, city: 'Казань', about: 'Люблю рисовать' }
    await expect(childrenApi.create(input)).resolves.toEqual(created)
    expect(post).toHaveBeenCalledWith('/children', input)
  })
})

describe('childrenApi.media / bySlug / byId', () => {
  it('media отдаёт галерею профиля владельцу', async () => {
    const assets = [{ id: 'med_1', status: 'ready' }]
    get.mockResolvedValueOnce({ data: assets })

    await expect(childrenApi.media('chd_1')).resolves.toEqual(assets)
    expect(get).toHaveBeenCalledWith('/children/chd_1/media')
  })

  it('bySlug отдаёт публичный профиль по слагу', async () => {
    const publicProfile = { id: 'chd_1', slug: 'masha', name: 'Маша', media: [] }
    get.mockResolvedValueOnce({ data: publicProfile })

    await expect(childrenApi.bySlug('masha')).resolves.toEqual(publicProfile)
    expect(get).toHaveBeenCalledWith('/children/by-slug/masha')
  })

  it('byId отдаёт профиль владельца по id', async () => {
    const own = child({ id: 'chd_9' })
    get.mockResolvedValueOnce({ data: own })

    await expect(childrenApi.byId('chd_9')).resolves.toEqual(own)
    expect(get).toHaveBeenCalledWith('/children/chd_9')
  })
})

describe('childrenApi.update', () => {
  it('патчит изменяемые поля профиля', async () => {
    const updated = child({ name: 'Мария', age: 8 })
    patch.mockResolvedValueOnce({ data: updated })

    const input = { name: 'Мария', age: 8, city: 'Москва' }
    await expect(childrenApi.update('chd_1', input)).resolves.toEqual(updated)
    expect(patch).toHaveBeenCalledWith('/children/chd_1', input)
  })
})

describe('childrenApi.submitForReview', () => {
  it('отправляет профиль на модерацию без тела', async () => {
    const pending = child({ status: 'pending_review' })
    post.mockResolvedValueOnce({ data: pending })

    await expect(childrenApi.submitForReview('chd_1')).resolves.toEqual(pending)
    expect(post).toHaveBeenCalledWith('/children/chd_1/submit')
  })
})

describe('childrenApi.grantConsent', () => {
  it('фиксирует согласие с версией документа', async () => {
    const consented = child({ hasDisability: true, disabilityConsentAt: '2026-11-18T00:00:00.000Z' })
    post.mockResolvedValueOnce({ data: consented })

    await expect(childrenApi.grantConsent('chd_1', 'v3')).resolves.toEqual(consented)
    expect(post).toHaveBeenCalledWith('/children/chd_1/disability-consent', {
      accepted: true,
      consentVersion: 'v3',
    })
  })
})

describe('childrenApi.revokeConsent', () => {
  it('отзывает согласие на спецданные', async () => {
    const revoked = child({ hasDisability: false, disabilityConsentAt: null })
    del.mockResolvedValueOnce({ data: revoked })

    await expect(childrenApi.revokeConsent('chd_1')).resolves.toEqual(revoked)
    expect(del).toHaveBeenCalledWith('/children/chd_1/disability-consent')
  })
})
