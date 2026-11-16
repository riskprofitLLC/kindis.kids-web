import { Navigate, Outlet, useLocation } from 'react-router-dom'

import { useSessionStore } from '@/entities/session/model/session-store'
import { routes } from '@/shared/config/routes'
import type { UserRole } from '@/shared/domain/user'

// Защита роутов по роли (этап 1): пока сессия не заполнена — на вход
export function RequireRole({ roles }: { roles: UserRole[] }) {
  const status = useSessionStore((state) => state.status)
  const hasRole = useSessionStore((state) => state.hasRole(roles))
  const location = useLocation()

  if (status === 'anonymous') {
    return <Navigate to={routes.login} state={{ from: location.pathname }} replace />
  }
  if (!hasRole) {
    return <Navigate to={routes.cabinet} replace />
  }
  return <Outlet />
}
