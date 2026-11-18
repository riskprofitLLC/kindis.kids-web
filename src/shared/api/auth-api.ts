import { api } from '@/shared/api/client'
import { tokenStorage } from '@/shared/api/token-storage'
import type { User, UserRole } from '@/shared/domain/user'
import { parseJwtPayload } from '@/shared/lib/jwt'

interface TokenPair {
  accessToken: string
  refreshToken: string
}

export interface RegisterInput {
  email: string
  password: string
  fullName: string
}

// Пользователь собирается из claims access-токена: отдельного /me на бэкенде нет.
function userFromToken(token: string): User {
  const claims = parseJwtPayload(token)
  if (!claims?.sub || !claims.email || !claims.role) {
    throw new Error('Не удалось прочитать токен сессии')
  }
  return {
    id: claims.sub,
    email: claims.email,
    fullName: null,
    phone: null,
    city: null,
    role: claims.role as UserRole,
  }
}

function persistSession(tokens: TokenPair): User {
  tokenStorage.set(tokens.accessToken)
  tokenStorage.setRefresh(tokens.refreshToken)
  return userFromToken(tokens.accessToken)
}

export const authApi = {
  async register(input: RegisterInput): Promise<{ userId: string }> {
    const { data } = await api.post<{ userId: string }>('/auth/register', input)
    return data
  },

  async login(email: string, password: string): Promise<User> {
    const { data } = await api.post<TokenPair>('/auth/login', { email, password })
    return persistSession(data)
  },

  // ВРЕМЕННО: вход без пароля под демо-аккаунт (только при VITE_DEV_LOGIN=1).
  async devLogin(role: 'buyer' | 'seller'): Promise<User> {
    const { data } = await api.post<TokenPair>('/auth/dev-login', { role })
    return persistSession(data)
  },

  async verifyEmail(email: string, code: string): Promise<User> {
    const { data } = await api.post<TokenPair>('/auth/verify-email', { email, code })
    return persistSession(data)
  },

  async forgotPassword(email: string): Promise<void> {
    await api.post('/auth/forgot-password', { email })
  },

  async resetPassword(email: string, code: string, password: string): Promise<void> {
    await api.post('/auth/reset-password', { email, code, password })
  },
  // Подъём сессии после перезагрузки: обмен refresh на новую пару.
  async restoreSession(): Promise<User | null> {
    const refreshToken = tokenStorage.getRefresh()
    if (!refreshToken) return null
    try {
      const { data } = await api.post<TokenPair>('/auth/refresh', { refreshToken })
      return persistSession(data)
    } catch {
      tokenStorage.clear()
      tokenStorage.clearRefresh()
      return null
    }
  },

  async logout(): Promise<void> {
    const refreshToken = tokenStorage.getRefresh()
    try {
      await api.post('/auth/logout', refreshToken ? { refreshToken } : undefined)
    } finally {
      tokenStorage.clear()
      tokenStorage.clearRefresh()
    }
  },
}
