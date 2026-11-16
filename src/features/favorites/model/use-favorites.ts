import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { useSessionStore } from '@/entities/session/model/session-store'
import { favoritesApi } from '@/shared/api/favorites-api'

export function useFavorites() {
  return useQuery({
    queryKey: ['favorites'],
    queryFn: () => favoritesApi.list(),
  })
}

// ID избранного покупателя — для сердечек на карточках каталога и товара.
export function useFavoriteIds(): string[] {
  const status = useSessionStore((state) => state.status)

  const favorites = useQuery({
    queryKey: ['favorites'],
    queryFn: () => favoritesApi.list(),
    // Гостям нечего показывать：запрос ушёл бы в 401.
    enabled: status === 'authenticated',
  })

  return favorites.data?.map((product) => product.id) ?? []
}

export function useToggleFavorite() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ productId, inFavorite }: { productId: string; inFavorite: boolean }) =>
      inFavorite ? favoritesApi.remove(productId) : favoritesApi.add(productId),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['favorites'] }),
  })
}
