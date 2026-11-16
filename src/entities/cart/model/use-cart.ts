import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { type Cart,cartApi } from '@/shared/api/cart-api'

// Корзина живёт на сервере：гость — по сессии в заголовке，пользователь — по токену.
export function useCart() {
  return useQuery({
    queryKey: ['cart'],
    queryFn: () => cartApi.get(),
    staleTime: 10_000,
  })
}

export function useAddToCart() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ productId, quantity }: { productId: string; quantity?: number }) =>
      cartApi.addItem(productId, quantity),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['cart'] }),
  })
}

export function useUpdateCartItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ itemId, quantity }: { itemId: string; quantity: number }) =>
      cartApi.updateQuantity(itemId, quantity),
    // Оптимистично меняем количество：ответ сервера только подтверждает.
    onMutate: async ({ itemId, quantity }) => {
      await queryClient.cancelQueries({ queryKey: ['cart'] })
      const previous = queryClient.getQueryData<Cart>(['cart'])
      if (previous) {
        const next: Cart = {
          ...previous,
          items: previous.items.map((item) => (item.id === itemId ? { ...item, quantity } : item)),
        }
        queryClient.setQueryData<Cart>(['cart'], next)
      }
      return { previous }
    },
    onError: (_error, _variables, context) => {
      if (context?.previous !== undefined) {
        queryClient.setQueryData(['cart'], context.previous)
      }
    },
    onSettled: () => void queryClient.invalidateQueries({ queryKey: ['cart'] }),
  })
}

export function useRemoveCartItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (itemId: string) => cartApi.removeItem(itemId),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['cart'] }),
  })
}

export function useClearCart() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => cartApi.clear(),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['cart'] }),
  })
}

// Слияние гостевой корзины с пользовательской после входа.
export function useMergeGuestCart() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => cartApi.merge(),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['cart'] }),
  })
}
