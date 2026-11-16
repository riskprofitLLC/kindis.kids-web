import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

import { useSessionStore } from '@/entities/session/model/session-store'
import { authEvents } from '@/shared/api/auth-events'
import { tokenStorage } from '@/shared/api/token-storage'
import { routes } from '@/shared/config/routes'

// Реакция на невалидный refresh: чистим сессию и уводим на вход
export function SessionExpiredHandler() {
  const navigate = useNavigate()
  const clearSession = useSessionStore((state) => state.clearSession)

  useEffect(() => {
    const unsubscribe = authEvents.onExpired(() => {
      tokenStorage.clear()
      clearSession()
      void navigate(routes.login, { replace: true })
    })
    return unsubscribe
  }, [navigate, clearSession])

  return null
}
