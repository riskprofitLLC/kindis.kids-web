import { useQuery } from '@tanstack/react-query'

import { catalogApi, type CategoryNode } from '@/shared/api/catalog-api'

// Дерево категорий меняется редко — держим долгий staleTime.
export function useCategories() {
  return useQuery<CategoryNode[]>({
    queryKey: ['categories'],
    queryFn: () => catalogApi.categories(),
    staleTime: 5 * 60_000,
  })
}
