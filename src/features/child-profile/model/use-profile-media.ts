import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { childrenApi } from '@/shared/api/children-api'
import type { MediaAsset } from '@/shared/api/media-api'
import { mediaApi } from '@/shared/api/media-api'

export const profileMediaKey = (profileId: string) => ['children', profileId, 'media'] as const

// Пока есть файл в загрузке или сжатии — опрашиваем сервер,
// чтобы статус «обрабатывается» сам сменился на «готово».
function hasPending(data: MediaAsset[] | undefined): boolean {
  return (data ?? []).some((asset) => asset.status === 'uploading' || asset.status === 'processing')
}

export function useProfileMedia(profileId: string | null) {
  return useQuery({
    queryKey: profileMediaKey(profileId ?? 'none'),
    queryFn: () => childrenApi.media(profileId as string),
    enabled: profileId !== null,
    refetchInterval: (query) => (hasPending(query.state.data) ? 3000 : false),
  })
}

export function useDeleteProfileMedia(profileId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (mediaId: string) => mediaApi.remove(mediaId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: profileMediaKey(profileId) })
    },
  })
}
