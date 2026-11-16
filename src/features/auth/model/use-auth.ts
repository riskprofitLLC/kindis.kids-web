import { useMutation, useQueryClient } from '@tanstack/react-query'

import { useSessionStore } from '@/entities/session/model/session-store'
import { authApi, type RegisterInput } from '@/shared/api/auth-api'
import { cartApi } from '@/shared/api/cart-api'
import { clearGuestSessionId, getGuestSessionId } from '@/shared/lib/guest-session'

// После входа гостевая корзина сливается с пользовательской：товары，которые
// гость набрал до регистрации，не теряются.
async function mergeGuestCart(queryClient: ReturnType<typeof useQueryClient>) {
  try {
    await cartApi.mergeWithSession(getGuestSessionId())
    clearGuestSessionId()
    void queryClient.invalidateQueries({ queryKey: ['cart'] })
  } catch {
    // Слияние не должно ломать вход：корзина останется гостевой до следующего раза.
  }
}

// Мутации авторизации: сессию пишем в store, навигация — на стороне страниц.
export function useLogin() {
  const setSession = useSessionStore((state) => state.setSession)
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: { email: string; password: string }) =>
      authApi.login(input.email, input.password),
    onSuccess: (user) => {
      setSession(user)
      void mergeGuestCart(queryClient)
    },
  })
}

export function useRegister() {
  return useMutation({
    mutationFn: (input: RegisterInput) => authApi.register(input),
  })
}

export function useVerifyEmail() {
  const setSession = useSessionStore((state) => state.setSession)
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: { email: string; code: string }) =>
      authApi.verifyEmail(input.email, input.code),
    onSuccess: (user) => {
      setSession(user)
      void mergeGuestCart(queryClient)
    },
  })
}

export function useForgotPassword() {
  return useMutation({
    mutationFn: (email: string) => authApi.forgotPassword(email),
  })
}

export function useResetPassword() {
  return useMutation({
    mutationFn: (input: { email: string; code: string; password: string }) =>
      authApi.resetPassword(input.email, input.code, input.password),
  })
}

export function useLogout() {
  const clearSession = useSessionStore((state) => state.clearSession)

  return useMutation({
    mutationFn: () => authApi.logout(),
    // Локальные токены снимаются даже при сетевом сбое, поэтому чистим всегда.
    onSettled: clearSession,
  })
}
