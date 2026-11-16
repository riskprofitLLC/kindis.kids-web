import { api } from '@/shared/api/client'
import type { User } from '@/shared/domain/user'

export interface UpdateProfileInput {
  fullName?: string
  phone?: string
  city?: string
}

// Профиль родителя и смена пароля.
// Эндпоинты модуля users на бэкенде: GET/PATCH /users/me, POST /auth/change-password.
export const usersApi = {
  async updateProfile(input: UpdateProfileInput): Promise<User> {
    const { data } = await api.patch<User>('/users/me', input)
    return data
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await api.post('/auth/change-password', {
      currentPassword,
      newPassword,
    })
  },
}
