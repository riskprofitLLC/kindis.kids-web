import { Link, useNavigate } from 'react-router-dom'

import { useSessionStore } from '@/entities/session/model/session-store'
import { useLogout } from '@/features/auth/model/use-auth'
import { routes } from '@/shared/config/routes'
import { Button } from '@/shared/ui/button/button'

// Меню авторизованного пользователя в шапке
export function UserMenu() {
  const navigate = useNavigate()
  const user = useSessionStore((state) => state.user)
  const logout = useLogout()

  if (!user) {
    return (
      <Button asChild variant="outline" size="sm">
        <Link to={routes.login}>Войти</Link>
      </Button>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <Button asChild variant="ghost" size="sm">
        <Link to={routes.cabinet}>{user.fullName ?? user.email}</Link>
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={logout.isPending}
        onClick={() =>
          logout.mutate(undefined, {
            // Токены очищаются в любом случае, поэтому уводим на главную всегда.
            onSettled: () => void navigate(routes.home, { replace: true }),
          })
        }
      >
        Выйти
      </Button>
    </div>
  )
}
