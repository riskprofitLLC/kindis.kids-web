import { api } from '@/shared/api/client'
import { ApiError } from '@/shared/api/errors'
import type { User } from '@/shared/domain/user'

export interface UpdateProfileInput {
  fullName?: string
  phone?: string
  city?: string
}

// Бэкенд отвечает 404/405 на ещё не реализованные методы модуля users.
const UNAVAILABLE_MESSAGE = 'Этот раздел пока недоступно на сервере'
const FALLBACK_MESSAGE = 'Что-то пошло не так. Попробуйте ещё раз.'

function asUsersError(error: unknown): Error {
  if (error instanceof ApiError && (error.status === 404 || error.status === 405)) {
    return new ApiError(UNAVAILABLE_MESSAGE, error.status)
  }
  return error instanceof Error ? error : new ApiError(FALLBACK_MESSAGE, 0)
}

// Профиль родителя и смена пароля.
// Эндпоинты модуля users на бэкенде: GET/PATCH /users/me, POST /auth/change-password.
export const usersApi = {
  async updateProfile(input: UpdateProfileInput): Promise<User> {
    try {
      const { data } = await api.patch<User>('/users/me', input)
      return data
    } catch (error) {
      throw asUsersError(error)
    }
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    try {
      await api.post('/auth/change-password', {
        currentPassword,
        newPassword,
      })
    } catch (error) {
      throw asUsersError(error)
    }
  },
}