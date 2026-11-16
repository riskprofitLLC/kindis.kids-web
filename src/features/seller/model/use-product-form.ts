import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { childrenApi } from '@/shared/api/children-api'
import { isApiError } from '@/shared/api/errors'
import { productsApi } from '@/shared/api/products-api'
import { routes } from '@/shared/config/routes'

// Координата к числу: число, числовая строка или null.
function toCoord(value: number | string | null | undefined): number | null {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}

// Бэкенд ещё не принимает поля места — отвечает отказом по whitelist.
// fields приходит и массивом {field,...}, и объектом «поле -> код».
function locationRejected(error: unknown): boolean {
  if (!isApiError(error)) return false
  const fields = error.fields as unknown
  const names = Array.isArray(fields)
    ? fields.map((row) => (row as { field?: string })?.field ?? '')
    : Object.keys((fields as Record<string, string>) ?? {})
  return names.some((name) => ['address', 'latitude', 'longitude'].includes(name))
}

export interface ProductFormValues {
  title: string
  description: string
  priceRub: string
  stock: string
  categoryId: string
  // Место сделки: адрес и точка с карты.
  address: string
  latitude: number | null
  longitude: number | null
}

const EMPTY: ProductFormValues = {
  title: '',
  description: '',
  priceRub: '',
  stock: '1',
  categoryId: '',
  address: '',
  latitude: null,
  longitude: null,
}

const LOCATION_NOTICE =
  'Место сделки пока не сохранилось — бэкенд ещё не принимает эти поля. Остальные изменения сохранены.'

// Состояние и сохранение формы товара: черновик или публикация на модерацию.
export function useProductForm(productId: string | undefined) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const isEdit = Boolean(productId)

  const [values, setValues] = useState<ProductFormValues>(EMPTY)
  const [error, setError] = useState<string | null>(null)
  // Предупреждение, если бэкенд ещё не принял место сделки.
  const [locationNotice, setLocationNotice] = useState<string | null>(null)

  const profiles = useQuery({
    queryKey: ['my-children'],
    queryFn: () => childrenApi.mine(),
  })

  // При редактировании подставляем текущие значения товара.
  const allProducts = useQuery({
    queryKey: ['seller-products'],
    queryFn: () => productsApi.mine(),
  })

  const editing = isEdit
    ? (allProducts.data ?? []).find((product) => product.id === productId)
    : undefined

  // Сброс формы при смене редактируемого товара — во время рендера,
  // иначе эффект вызывает каскадные перерисовки.
  const [prefilledFor, setPrefilledFor] = useState<string | undefined>(undefined)
  if (editing && prefilledFor !== editing.id) {
    setPrefilledFor(editing.id)
    setValues({
      title: editing.title,
      description: editing.description ?? '',
      priceRub: String(Math.round(editing.priceKopecks / 100)),
      stock: String(editing.stock),
      categoryId: editing.categoryId ?? '',
      address: editing.address ?? '',
      // Координаты бэкенд может отдать строкой — приводим к числу.
      latitude: toCoord(editing.latitude),
      longitude: toCoord(editing.longitude),
    })
  }

  const save = useMutation({
    mutationFn: async (publish: boolean): Promise<{ locationDropped: boolean }> => {
      const price = Number(values.priceRub)
      if (!values.title.trim() || !Number.isFinite(price) || price <= 0) {
        throw new Error('Заполните название и цену')
      }

      // Место уходит в payload только когда продавец его задал — иначе
      // бэкенд без этих полей счёл бы запрос некорректным.
      const hasLocation =
        Boolean(values.address.trim()) || values.latitude !== null || values.longitude !== null
      const location = hasLocation
        ? {
            address: values.address.trim() || null,
            latitude:
              typeof values.latitude === 'number' && Number.isFinite(values.latitude)
                ? values.latitude
                : null,
            longitude:
              typeof values.longitude === 'number' && Number.isFinite(values.longitude)
                ? values.longitude
                : null,
          }
        : {}

      const base = {
        title: values.title.trim(),
        description: values.description.trim() || undefined,
        priceKopecks: Math.round(price * 100),
        stock: Number(values.stock) || 0,
        categoryId: values.categoryId || null,
      }

      // Пока бэкенд не принимает поля места,повторяем сохранение без них —
      // продавец не теряет остальные правки из-за географической части.
      const persist = async (withLocation: boolean): Promise<{ locationDropped: boolean }> => {
        const input = withLocation ? { ...base, ...location } : base

        try {
          if (isEdit && productId) {
            const saved = await productsApi.update(productId, input)
            if (publish && saved.status === 'draft') {
              await productsApi.submit(saved.id)
            }
          } else {
            const profileId = (profiles.data ?? [])[0]?.id || ''
            if (!profileId) {
              throw new Error('Сначала создайте профиль ребёнка')
            }
            const created = await productsApi.create(profileId, input)
            if (publish) {
              await productsApi.submit(created.id)
            }
          }
          return { locationDropped: false }
        } catch (persistError) {
          if (withLocation && locationRejected(persistError)) {
            setLocationNotice(LOCATION_NOTICE)
            return persist(false)
          }
          throw persistError
        }
      }

      return persist(hasLocation)
    },
    onSuccess: (result) => {
      void queryClient.invalidateQueries({ queryKey: ['seller-products'] })
      // Место не сохранилось — остаёмся на форме, чтобы продавец увидел предупреждение.
      if (result.locationDropped) return
      void navigate(routes.cabinetProducts)
    },
    onError: (mutationError) =>
      setError(
        mutationError instanceof Error ? mutationError.message : 'Не удалось сохранить товар',
      ),
  })

  return {
    values,
    setValues,
    error,
    locationNotice,
    save,
    isEdit,
    profilesPending: profiles.isPending,
  }
}
