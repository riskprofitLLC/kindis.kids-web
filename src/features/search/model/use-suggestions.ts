import { useQuery } from '@tanstack/react-query'

import { catalogApi, type CatalogSuggestion } from '@/shared/api/catalog-api'

// Живые подсказки:отдельная лёгкая выдача бэкенда,без фасетов и total.
export function useSuggestions(query: string) {
  const term = query.trim()

  return useQuery<CatalogSuggestion[]>({
    queryKey: ['suggestions', term],
    enabled: term.length >= 2,
    staleTime: 30_000,
    queryFn: () => catalogApi.suggestions(term),
  })
}
