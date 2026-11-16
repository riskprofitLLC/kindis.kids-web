import { describe, expect, it } from 'vitest'

import { ApiError, isApiError } from '@/shared/api/errors'

describe('ApiError', () => {
  it('носит сообщение, статус и имя', () => {
    const error = new ApiError('Товар закончился', 409)
    expect(error).toBeInstanceOf(Error)
    expect(error.message).toBe('Товар закончился')
    expect(error.status).toBe(409)
    expect(error.name).toBe('ApiError')
  })

  it('код и поля ошибки необязательны', () => {
    const bare = new ApiError('Сбой', 500)
    expect(bare.code).toBeUndefined()
    expect(bare.fields).toBeUndefined()

    const rich = new ApiError('Валидация', 422, 'VALIDATION', { email: 'Занят' })
    expect(rich.code).toBe('VALIDATION')
    expect(rich.fields).toEqual({ email: 'Занят' })
  })

  it('сетевой сбой кодируется статусом 0', () => {
    expect(new ApiError('Нет связи', 0).status).toBe(0)
  })
})

describe('isApiError', () => {
  it('узнаёт ApiError среди прочих ошибок', () => {
    expect(isApiError(new ApiError('Сбой', 400))).toBe(true)
    expect(isApiError(new Error('обычная'))).toBe(false)
    expect(isApiError('строка')).toBe(false)
    expect(isApiError(null)).toBe(false)
    expect(isApiError(undefined)).toBe(false)
  })
})