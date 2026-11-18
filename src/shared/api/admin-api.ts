import { api } from '@/shared/api/client'

// Кабинет администратора:модерация,справочники,аудит спецданных.

export interface QueueCounts {
  profiles: number
  products: number
  media: number
  reviews: number
  reports: number
}

export const adminApi = {
  async counts(): Promise<QueueCounts> {
    const { data } = await api.get<QueueCounts>('/admin/moderation/counts')
    return data
  },

  async profiles(): Promise<unknown[]> {
    const { data } = await api.get<unknown[]>('/admin/moderation/profiles')
    return data
  },

  async products(): Promise<unknown[]> {
    const { data } = await api.get<unknown[]>('/admin/moderation/products')
    return data
  },

  async media(): Promise<unknown[]> {
    const { data } = await api.get<unknown[]>('/admin/moderation/media')
    return data
  },

  async reviews(): Promise<unknown[]> {
    const { data } = await api.get<unknown[]>('/admin/moderation/reviews')
    return data
  },

  async reports(): Promise<unknown[]> {
    const { data } = await api.get<unknown[]>('/admin/moderation/reports')
    return data
  },

  // Действия модерации — пути разные для профилей,товаров,медиа и отзывов.
  async act(kind: string, id: string, action: 'approve' | 'reject' | 'block'): Promise<void> {
    await api.post(`/admin/moderation/${kind}/${id}/${action}`)
  },

  async resolveReport(id: string, status: 'resolved' | 'rejected'): Promise<void> {
    await api.post(`/admin/moderation/reports/${id}/resolve`, { status })
  },

  // ---------- Справочники ----------

  async categories(): Promise<unknown[]> {
    const { data } = await api.get<unknown[]>('/categories')
    return data
  },

  async createCategory(input: { name: string; slug: string; parentId?: string }): Promise<unknown> {
    const { data } = await api.post<unknown>('/categories/admin', input)
    return data
  },

  async deleteCategory(id: string): Promise<void> {
    await api.delete(`/categories/admin/${id}`)
  },

  async attributes(): Promise<unknown[]> {
    const { data } = await api.get<unknown[]>('/attributes')
    return data
  },

  async createAttribute(input: {
    name: string
    type: 'text' | 'number' | 'select'
    unit?: string
    values?: string[]
  }): Promise<unknown> {
    const { data } = await api.post<unknown>('/attributes/admin', input)
    return data
  },

  async deleteAttribute(id: string): Promise<void> {
    await api.delete(`/attributes/admin/${id}`)
  },

  // Аудит обращений к спецданным.
  async audit(params?: { entityType?: string; limit?: number }): Promise<unknown[]> {
    const { data } = await api.get<unknown[]>('/admin/audit', { params })
    return data
  },
}
