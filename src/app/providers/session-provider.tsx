import { type ReactNode,useEffect, useState } from 'react'

import { useSessionStore } from '@/entities/session/model/session-store'
import { authApi } from '@/shared/api/auth-api'

// Поднимает сессию из refresh-токена при старте: без этого RequireRole
// увёл бы авторизованного пользователя на /login после перезагрузки.
export function SessionProvider({ children }: { children: ReactNode }) {
  const setSession = useSessionStore((state) => state.setSession)
  const clearSession = useSessionStore((state) => state.clearSession)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let active = true

    void authApi.restoreSession().then((user) => {
      if (!active) return
      if (user) {
        setSession(user)
      } else {
        clearSession()
      }
      setReady(true)
    })

    return () => {
      active = false
    }
  }, [setSession, clearSession])

  if (!ready) {
    return (
      <div aria-busy="true" className="p-8 text-sm text-text-muted">
        Загружаем…
      </div>
    )
  }

  return <>{children}</>
}
