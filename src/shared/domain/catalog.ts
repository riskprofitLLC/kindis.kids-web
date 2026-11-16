// Доменные правила каталога: фильтры, сортировки, возрастные группы.
// Значения зеркалят бэкенд (catalog.service.ts); чистые функции без DOM —
// переиспользуются в React Native.

export const SORT_VALUES = ['newest', 'price_asc', 'price_desc', 'popular', 'rating'] as const

export type SortValue = (typeof SORT_VALUES)[number]

export const DEFAULT_SORT: SortValue = 'newest'

export const SORT_LABELS: Record<SortValue, string> = {
  newest: 'Сначала новые',
  price_asc: 'Цена по возрастанию',
  price_desc: 'Цена по убыванию',
  popular: 'Популярные',
  rating: 'Высокий рейтинг',
}

export interface CatalogFilters {
  query?: string
  categorySlug?: string | null
  // Цена в копейках, как на бэкенд.
  priceFromKopecks?: number | null
  priceToKopecks?: number | null
  inStockOnly?: boolean
  priorityOnly?: boolean
  ageFrom?: number | null
  ageTo?: number | null
  city?: string | null
}

export interface CatalogState {
  filters: CatalogFilters
  sort: SortValue
}

// Возрастные группы мастера — фасет и фильтр «возрастная группа».
export const AGE_BUCKETS = [
  { label: 'до 7 лет', fromAge: null, toAge: 6 },
  { label: '7–10 лет', fromAge: 7, toAge: 10 },
  { label: '11–14 лет', fromAge: 11, toAge: null },
] as const

function parsePositiveInt(value: string | undefined): number | null {
  if (!value) return null
  const parsed = Number.parseInt(value, 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null
}

function isSortValue(value: string | undefined): value is SortValue {
  return typeof value === 'string' && (SORT_VALUES as readonly string[]).includes(value)
}

// Номер возрастной группы по границам — для сериализации обратно в URL.
function ageBucketIndex(fromAge?: number | null, toAge?: number | null): number | null {
  if (fromAge === undefined && toAge === undefined) return null
  const index = AGE_BUCKETS.findIndex(
    (bucket) => bucket.fromAge === (fromAge ?? null) && bucket.toAge === (toAge ?? null),
  )
  return index >= 0 ? index + 1 : null
}

// Состояние каталога из параметров URL — shareable-ссылки и восстановление вида.
export function parseCatalogState(record: Record<string, string>): CatalogState {
  const filters: CatalogFilters = {}

  const query = record.q?.trim()
  if (query) filters.query = query

  if (record.cat) filters.categorySlug = record.cat

  // В URL цена в рублях — людям так привычнее.
  const priceFromRub = parsePositiveInt(record.pmin)
  if (priceFromRub !== null) filters.priceFromKopecks = priceFromRub * 100

  const priceToRub = parsePositiveInt(record.pmax)
  if (priceToRub !== null) filters.priceToKopecks = priceToRub * 100

  if (record.stock === '1') filters.inStockOnly = true
  if (record.prio === '1') filters.priorityOnly = true

  // Возрастная группа в URL — номер бакета; совпадение ищем по границам.
  const bucketIndex = parsePositiveInt(record.age)
  const bucket =
    bucketIndex !== null && bucketIndex <= AGE_BUCKETS.length
      ? AGE_BUCKETS[bucketIndex - 1]
      : undefined
  if (bucket) {
    filters.ageFrom = bucket.fromAge
    filters.ageTo = bucket.toAge
  }

  const city = record.city?.trim()
  if (city) filters.city = city

  return {
    filters,
    sort: isSortValue(record.sort) ? record.sort : DEFAULT_SORT,
  }
}

// Обратная сборка параметров URL из состояния — shareable-ссылки.
export function serializeCatalogState(state: CatalogState): Record<string, string> {
  const record: Record<string, string> = {}
  const { filters } = state

  if (filters.query) record.q = filters.query
  if (filters.categorySlug) record.cat = filters.categorySlug
  if (filters.priceFromKopecks != null) {
    record.pmin = String(Math.round(filters.priceFromKopecks / 100))
  }
  if (filters.priceToKopecks != null) {
    record.pmax = String(Math.round(filters.priceToKopecks / 100))
  }
  if (filters.inStockOnly) record.stock = '1'
  if (filters.priorityOnly) record.prio = '1'

  const bucketIndex = ageBucketIndex(filters.ageFrom, filters.ageTo)
  if (bucketIndex !== null) record.age = String(bucketIndex)

  if (filters.city) record.city = filters.city

  if (state.sort !== DEFAULT_SORT) record.sort = state.sort

  return record
}