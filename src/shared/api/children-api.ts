import { api } from '@/shared/api/client'
import type { MediaAsset } from '@/shared/api/media-api'

export interface ChildProfile {
  id: string
  userId: string
  slug: string
  name: string
  age: number
  city: string | null
  avatar: string | null
  about: string | null
  status: 'draft' | 'pending_review' | 'active' | 'blocked'
  hasDisability: boolean
  disabilityVerified: boolean
  disabilityConsentAt: string | null
  consentDocumentVersion: string | null
}

// Публичная витрина продавца:профиль + медиа (спецполя бэкенд не отдаёт).
export interface SellerPublic {
  id: string
  slug: string
  name: string
  age: number
  city: string | null
  about: string | null
  // Спецполя (hasDisability и согласия) бэкенд публично не отдаёт.
  // id медиа аватара — ссылку резолвим через /media/:id/url.
  avatarMediaId: string | null
  media: MediaAsset[]
}

export interface ChildProfileInput {
  name?: string
  age?: number
  city?: string
  about?: string
  slug?: string
}

export const childrenApi = {
  async mine(): Promise<ChildProfile[]> {
    const { data } = await api.get<ChildProfile[]>('/children/mine')
    return data
  },

  async create(input: ChildProfileInput): Promise<ChildProfile> {
    const { data } = await api.post<ChildProfile>('/children', input)
    return data
  },

  // Медиа профиля для владельца: галерея кабинета и статус обработки видео.
  async media(id: string): Promise<MediaAsset[]> {
    const { data } = await api.get<MediaAsset[]>(`/children/${id}/media`)
    return data
  },

  async bySlug(slug: string): Promise<SellerPublic> {
    const { data } = await api.get<SellerPublic>(`/children/by-slug/${slug}`)
    return data
  },

  async byId(id: string): Promise<ChildProfile> {
    const { data } = await api.get<ChildProfile>(`/children/${id}`)
    return data
  },

  async update(id: string, input: ChildProfileInput): Promise<ChildProfile> {
    const { data } = await api.patch<ChildProfile>(`/children/${id}`, input)
    return data
  },

  async submitForReview(id: string): Promise<ChildProfile> {
    const { data } = await api.post<ChildProfile>(`/children/${id}/submit`)
    return data
  },

  // Согласие на спецданные фиксируется с версией документа, который принял родитель.
  async grantConsent(childId: string, consentVersion: string): Promise<ChildProfile> {
    const { data } = await api.post<ChildProfile>(`/children/${childId}/disability-consent`, {
      accepted: true,
      consentVersion,
    })
    return data
  },

  async revokeConsent(childId: string): Promise<ChildProfile> {
    const { data } = await api.delete<ChildProfile>(`/children/${childId}/disability-consent`)
    return data
  },
}
