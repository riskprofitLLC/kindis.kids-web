import { useQuery } from '@tanstack/react-query'

import { childrenApi } from '@/shared/api/children-api'

// Публичная страница продавца по человекочитаемому slug.
export function useSeller(slug: string | undefined) {
  return useQuery({
    queryKey: ['seller', slug],
    enabled: Boolean(slug),
    queryFn: () => childrenApi.bySlug(slug as string),
  })
}
