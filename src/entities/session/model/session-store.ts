import { create } from 'zustand'

import type { User, UserRole } from '@/shared/domain/user'

interface SessionState {
  user: User | null
  status: 'anonymous' | 'authenticated'
  setSession: (user: User) => void
  clearSession: () => void
  hasRole: (roles: UserRole[]) => boolean
}

export const useSessionStore = create<SessionState>((set, get) => ({
  user: null,
  status: 'anonymous',
  setSession: (user) => set({ user, status: 'authenticated' }),
  clearSession: () => set({ user: null, status: 'anonymous' }),
  hasRole: (roles) => {
    const { user } = get()
    return user !== null && roles.includes(user.role)
  },
}))
