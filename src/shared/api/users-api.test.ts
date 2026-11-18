import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ApiError } from '@/shared/api/errors'
import type { User } from '@/shared/domain/user'

const patch = vi.fn()
const post = vi.fn()

vi.mock('@/shared/api/client', () => ({
  api: {
    patch: (...args: unknown[]) => patch(...args),
    post: (...args: unknown[]) => post(...args),
  },
}))

const { usersApi } = await import('@/shared/api/users-api')

const user: User = {
  id: 'u-1',
  email: 'parent@example.com',
  fullName: 'Мария Иванова',
  phone: '+79990001234',
  city: 'Москва',
  role: 'parent',
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('usersApi.updateProfile', () => {
  it('возвращает сохранённого пользователя', async () => {
    patch.mockResolvedValueOnce({ data: user })

    await expect(usersApi.updateProfile({ fullName: 'Мария Иванова' })).resolves.toEqual(user)
    expect(patch).toHaveBeenCalledWith('/users/me', { fullName: 'Мария Иванова' })
  })

  it('404 и 405 объясняют, что раздел пока недоступен', async () => {
    patch.mockRejectedValueOnce(new ApiError('Cannot PATCH /users/me', 404))

    await expect(usersApi.updateProfile({ city: 'Москва' })).rejects.toMatchObject({
      message: 'Этот раздел пока недоступно на сервере',
      status: 404,
    })

    patch.mockRejectedValueOnce(new ApiError('Method Not Allowed', 405))

    await expect(usersApi.updateProfile({ city: 'Москва' })).rejects.toMatchObject({
      message: 'Этот раздел пока недоступно на сервере',
      status: 405,
    })
  })

  it('остальные ошибки проходят без изменений', async () => {
    patch.mockRejectedValueOnce(new ApiError('Проверьте формат телефона', 400))

    await expect(usersApi.updateProfile({ phone: '123' })).rejects.toThrow(
      'Проверьте формат телефона',
    )
  })
})

describe('usersApi.changePassword', () => {
  it('нереализованный метод объясняет человеческим текстом', async () => {
    post.mockRejectedValueOnce(new ApiError('Not Found', 404))

    await expect(usersApi.changePassword('old-secret', 'new-secret')).rejects.toMatchObject({
      message: 'Этот раздел пока недоступно на сервере',
      status: 404,
    })
  })
})