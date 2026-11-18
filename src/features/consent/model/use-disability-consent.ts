import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { type ChildProfile, childrenApi } from '@/shared/api/children-api'
import { CONSENT_DOCUMENT_VERSION } from '@/shared/domain/consent'

export const childProfilesKey = ['children', 'mine'] as const

export function useChildProfiles(enabled: boolean) {
  return useQuery({
    queryKey: childProfilesKey,
    queryFn: () => childrenApi.mine(),
    enabled,
  })
}

// Согласие и его отзыв; после действия обновляем список профилей.
export function useDisabilityConsent() {
  const queryClient = useQueryClient()

  const invalidate = () => queryClient.invalidateQueries({ queryKey: childProfilesKey })

  const grant = useMutation({
    mutationFn: (childId: string) => childrenApi.grantConsent(childId, CONSENT_DOCUMENT_VERSION),
    onSuccess: (_data: ChildProfile) => void invalidate(),
  })

  const revoke = useMutation({
    mutationFn: (childId: string) => childrenApi.revokeConsent(childId),
    onSuccess: (_data: ChildProfile) => void invalidate(),
  })

  return { grant, revoke }
}
