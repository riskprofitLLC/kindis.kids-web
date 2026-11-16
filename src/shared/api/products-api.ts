import { api } from '@/shared/api/client'

// Товары продавца в кабинете：CRUD，медиа，быстрое редактирование.

export type ProductStatus = 'draft' | 'pending_review' | 'active' | 'archived'

// Лимит фото товара — зеркалит PRODUCT_MEDIA_LIMIT на бэкенде.
export const PRODUCT_MEDIA_LIMIT = 30

export const PRODUCT_STATUS_LABELS: Record<ProductStatus, string> = {
  draft: 'Черновик',
  pending_review: 'На модерации',
  active: 'Активен',
  archived: 'В архиве',
}

export interface SellerProduct {
  id: string
  title: string
  description: string | null
  priceKopecks: number
  stock: number
  status: ProductStatus
  categoryId: string | null
  createdAt: string
  // Место сделки：бэкенд отдаёт поля，когда продавец заполнил точку на карте.
  // Координаты могут прийти строкой — форму приводит их к числу.
  address?: string | null
  latitude?: number | string | null
  longitude?: number | string | null
}

export interface ProductInput {
  title: string
  description?: string
  priceKopecks: number
  stock?: number
  categoryId?: string | null
  // Адрес и координаты пункта — опциональны，уходят только когда заданы.
  address?: string | null
  latitude?: number | null
  longitude?: number | null
}

export interface ProductMediaRow {
  mediaId: string
  sortOrder: number
  kind: 'photo' | 'video'
}

export const productsApi = {
  // Товары продавца：свои профили + их товары.
  async mine(): Promise<SellerProduct[]> {
    // Товары лежат в профилях детей：собираем со всех профилей продавца.
    const { data: profiles } = await api.get<Array<{ id: string }>>('/children/mine')
    const lists = await Promise.all(
      profiles.map(async (profile) => {
        const { data } = await api.get<SellerProduct[]>(`/children/${profile.id}/products`)
        return data
      }),
    )

    return lists.flat()
  },

  async create(childProfileId: string, input: ProductInput): Promise<SellerProduct> {
    const { data } = await api.post<SellerProduct>(`/children/${childProfileId}/products`, input)
    return data
  },

  async update(id: string, input: Partial<ProductInput>): Promise<SellerProduct> {
    const { data } = await api.patch<SellerProduct>(`/products/${id}`, input)
    return data
  },

  // Статусы：на модерацию，в архив，из архива，удаление.
  async submit(id: string): Promise<SellerProduct> {
    const { data } = await api.post<SellerProduct>(`/products/${id}/submit`)
    return data
  },

  async archive(id: string): Promise<SellerProduct> {
    const { data } = await api.post<SellerProduct>(`/products/${id}/archive`)
    return data
  },

  async restore(id: string): Promise<SellerProduct> {
    const { data } = await api.post<SellerProduct>(`/products/${id}/restore`)
    return data
  },

  async remove(id: string): Promise<void> {
    await api.delete(`/products/${id}`)
  },

  // ---------- Медиа товара ----------

  async media(productId: string): Promise<ProductMediaRow[]> {
    const { data } = await api.get<ProductMediaRow[]>(`/products/${productId}/media`)
    return data
  },

  async attachMedia(productId: string, mediaId: string): Promise<ProductMediaRow[]> {
    const { data } = await api.post<ProductMediaRow[]>(`/products/${productId}/media/${mediaId}`)
    return data
  },

  // Порядок фото：первое в списке — главное.
  async reorderMedia(productId: string, mediaIds: string[]): Promise<ProductMediaRow[]> {
    const { data } = await api.patch<ProductMediaRow[]>(`/products/${productId}/media/order`, {
      mediaIds,
    })
    return data
  },

  async detachMedia(productId: string, mediaId: string): Promise<void> {
    await api.delete(`/products/${productId}/media/${mediaId}`)
  },
}
