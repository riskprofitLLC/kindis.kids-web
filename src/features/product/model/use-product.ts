import { useQuery } from '@tanstack/react-query'

import { catalogApi } from '@/shared/api/catalog-api'

export function useProduct(id: string | undefined) {
  return useQuery({
    queryKey: ['product', id],
    enabled: Boolean(id),
    queryFn: () => catalogApi.product(id as string),
  })
}

// Похожие товары из той же категории.
export function useSimilarProducts(id: string | undefined) {
  return useQuery({
    queryKey: ['product-similar', id],
    enabled: Boolean(id),
    queryFn: () => catalogApi.similar(id as string),
  })
}
