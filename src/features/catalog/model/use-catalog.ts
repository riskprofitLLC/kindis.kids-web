import { useInfiniteQuery } from '@tanstack/react-query'

import { catalogApi, type CatalogSearchParams } from '@/shared/api/catalog-api'

// Каталог курсорный: страницы догружаются по nextCursor при прокрутке.
export function useCatalog(params: Omit<CatalogSearchParams, 'cursor'>) {
  return useInfiniteQuery({
    queryKey: ['catalog', params],
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam }) => catalogApi.search({ ...params, cursor: pageParam }),
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  })
}
