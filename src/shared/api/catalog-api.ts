import { api } from '@/shared/api/client'

// Типы публичного каталога. Цена — в копейках, как на бэкенде.

export interface CategoryRef {
  id: string
  name: string
  slug: string
}

export interface SellerRef {
  id: string
  slug: string
  name: string
  age: number
  city: string | null
  hasDisability: boolean
}

// Тип медиа товара: бэкенд отдаёт kind у вложенного media.
export type MediaKind = 'photo' | 'video'

export interface ProductMedia {
  id: string
  kind: MediaKind
}

export interface ProductCard {
  id: string
  title: string
  description: string | null
  priceKopecks: number
  stock: number
  createdAt: string
  category: CategoryRef | null
  childProfile: SellerRef | null
  // Медиа товара с типом — для ссылки на чтение резолвим через /media/:id/url.
  media: ProductMedia[]
  // Место сделки:адрес и точка на карте. Бэкенд отдаёт,когда продавец заполнил.
  address?: string | null
  latitude?: number | null
  longitude?: number | null
}

export interface CatalogFacets {
  categories?: Array<{ slug: string; name: string; count: number }>
  cities?: Array<{ city: string; count: number }>
  ageBuckets?: Array<{
    label: string
    fromAge: number | null
    toAge: number | null
    count: number
  }>
}

export interface CatalogPage {
  items: ProductCard[]
  nextCursor: string | null
  total: number
  facets?: CatalogFacets
}

export interface CatalogSearchParams {
  query?: string
  categorySlug?: string | null
  priceFromKopecks?: number | null
  priceToKopecks?: number | null
  inStockOnly?: boolean
  priorityOnly?: boolean
  ageFrom?: number | null
  ageTo?: number | null
  city?: string | null
  childSlug?: string | null
  sort?: string
  cursor?: string
  limit?: number
}

// Характеристика товара в виде «навание — значение» для таблицы.
export interface ProductSpec {
  name: string
  value: string
}

export interface ProductDetail {
  id: string
  title: string
  description: string | null
  priceKopecks: number
  stock: number
  createdAt: string
  category: CategoryRef | null
  childProfile: (SellerRef & { about: string | null; avatarMediaId: string | null }) | null
  media: ProductMedia[]
  // Место сделки:адрес и точка на карте — когда продавец заполнил.
  address?: string | null
  latitude?: number | null
  longitude?: number | null
  specs: ProductSpec[]
  rating: number | null
  reviewsCount: number
}

// Сырой товар из выдачи каталога: медиа приходят вложенным в ProductMedia.
export interface RawProduct {
  id: string
  title: string
  description: string | null
  priceKopecks: number
  stock: number
  createdAt: string
  category: CategoryRef | null
  childProfile: SellerRef | null
  media?: Array<{ sortOrder: number; media?: { id: string; kind?: string } | null }>
  address?: string | null
  // Координаты бэкенд может отдать строкой (Decimal) — нормализуем в число.
  latitude?: number | string | null
  longitude?: number | string | null
}

// Координата к числу:число,числовая строка или null.
function toCoord(value: number | string | null | undefined): number | null {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}

// Видео отличаем явно, всё остальное считаем фото — бэкенд отдаёт только эти два типа.
function toMediaKind(value: string | undefined): MediaKind {
  return value === 'video' ? 'video' : 'photo'
}

export function toCard(raw: RawProduct): ProductCard {
  const media = (raw.media ?? [])
    .slice()
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .flatMap((row) => {
      const asset = row.media
      if (!asset?.id) return []
      return [{ id: asset.id, kind: toMediaKind(asset.kind) }]
    })

  return {
    id: raw.id,
    title: raw.title,
    description: raw.description,
    priceKopecks: raw.priceKopecks,
    stock: raw.stock,
    createdAt: raw.createdAt,
    category: raw.category ?? null,
    childProfile: raw.childProfile ?? null,
    media,
    address: raw.address ?? null,
    latitude: toCoord(raw.latitude),
    longitude: toCoord(raw.longitude),
  }
}

// Значение характеристики к строке таблицы: select — значение, text/number — данные.
function specValue(row: {
  textValue?: string | null
  numberValue?: number | string | null
  value?: { value: string } | null
  attribute?: { unit?: string | null } | null
  unit?: string | null
}): string {
  if (row.value?.value) return row.value.value
  if (row.textValue) return row.textValue
  if (row.numberValue !== null && row.numberValue !== undefined) {
    const unit = row.attribute?.unit ?? row.unit ?? ''
    return `${row.numberValue}${unit ? ` ${unit}` : ''}`
  }
  return '—'
}

// Дерево категорий: направление → группа → вид.
export interface CategoryNode {
  id: string
  name: string
  slug: string
  children: CategoryNode[]
}

// Подсказка для строки поиска: товар + продавец.
export interface CatalogSuggestion {
  id: string
  title: string
  priceKopecks: number
  sellerSlug: string
  sellerName: string
}

export const catalogApi = {
  async suggestions(query: string): Promise<CatalogSuggestion[]> {
    const { data } = await api.get<CatalogSuggestion[]>('/catalog/suggestions', {
      params: { query },
    })
    return data
  },

  async categories(): Promise<CategoryNode[]> {
    const { data } = await api.get<CategoryNode[]>('/categories')
    return data
  },

  async search(params: CatalogSearchParams): Promise<CatalogPage> {
    const { data } = await api.get<{
      items: RawProduct[]
      nextCursor: string | null
      total: number
      facets?: CatalogFacets
    }>('/catalog', { params })
    return {
      items: data.items.map(toCard),
      nextCursor: data.nextCursor,
      total: data.total,
      facets: data.facets,
    }
  },

  async product(id: string): Promise<ProductDetail> {
    const { data } = await api.get<
      RawProduct & {
        attributes?: Array<{
          attribute: { name: string; unit?: string | null }
          textValue?: string | null
          numberValue?: number | string | null
          value?: { value: string } | null
        }>
        rating?: number | null
        reviewsCount?: number
        childProfile?: (SellerRef & { about?: string | null; avatarMediaId?: string | null }) | null
      }
    >(`/products/public/${id}`)
    const card = toCard(data)

    return {
      ...card,
      specs: (data.attributes ?? []).map((row) => ({
        name: row.attribute.name,
        value: specValue(row),
      })),
      rating: data.rating ?? null,
      reviewsCount: data.reviewsCount ?? 0,
      childProfile: data.childProfile
        ? {
            ...data.childProfile,
            about: data.childProfile.about ?? null,
            avatarMediaId: data.childProfile.avatarMediaId ?? null,
          }
        : null,
    }
  },

  async similar(id: string): Promise<ProductCard[]> {
    const { data } = await api.get<RawProduct[]>(`/products/public/${id}/similar`)
    return data.map(toCard)
  },
}
