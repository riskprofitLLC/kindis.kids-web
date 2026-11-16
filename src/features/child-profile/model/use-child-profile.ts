import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { type ChildProfileInput, childrenApi } from '@/shared/api/children-api'

// Тот же ключ, что у согласия на спецданные — кеш общий.
export const childProfilesKey = ['children', 'mine'] as const

export function useMyChildProfiles(enabled = true) {
  return useQuery({
    queryKey: childProfilesKey,
    queryFn: () => childrenApi.mine(),
    enabled,
  })
}

export function useChildProfileMutations() {
  const queryClient = useQueryClient()

  const invalidate = () => queryClient.invalidateQueries({ queryKey: childProfilesKey })

  const create = useMutation({
    mutationFn: (input: ChildProfileInput) => childrenApi.create(input),
    onSuccess: () => void invalidate(),
  })

  const update = useMutation({
    mutationFn: ({ id, input }: { id: string; input: ChildProfileInput }) =>
      childrenApi.update(id, input),
    onSuccess: () => void invalidate(),
  })

  const submit = useMutation({
    mutationFn: (id: string) => childrenApi.submitForReview(id),
    onSuccess: () => void invalidate(),
  })

  return { create, update, submit }
}
