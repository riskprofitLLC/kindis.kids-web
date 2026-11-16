import { LocationPicker } from '@/features/map/ui/location-picker'
import type { ProductFormValues } from '@/features/seller/model/use-product-form'
import { CategorySelect } from '@/features/seller/ui/category-select'

interface ProductFormFieldsProps {
  values: ProductFormValues
  onChange: (next: ProductFormValues) => void
}

const inputClass = 'min-h-11 rounded-md border border-border px-3 text-sm'

// Поля товара：название，описание，цена в рублях，остаток，категория.
export function ProductFormFields({ values, onChange }: ProductFormFieldsProps) {
  const set = <K extends keyof ProductFormValues>(key: K, value: ProductFormValues[K]) =>
    onChange({ ...values, [key]: value })

  return (
    <>
      <label className="flex flex-col gap-1 text-sm">
        Название
        <input
          className={inputClass}
          value={values.title}
          onChange={(event) => set('title', event.target.value)}
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        Описание
        <textarea
          rows={4}
          className="rounded-md border border-border px-3 py-2 text-sm"
          value={values.description}
          onChange={(event) => set('description', event.target.value)}
        />
      </label>

      <div className="flex gap-3">
        <label className="flex flex-1 flex-col gap-1 text-sm">
          Цена，₽
          <input
            type="number"
            min={0}
            className={inputClass}
            value={values.priceRub}
            onChange={(event) => set('priceRub', event.target.value)}
          />
        </label>
        <label className="flex flex-1 flex-col gap-1 text-sm">
          Остаток
          <input
            type="number"
            min={0}
            className={inputClass}
            value={values.stock}
            onChange={(event) => set('stock', event.target.value)}
          />
        </label>
      </div>

      <CategorySelect value={values.categoryId} onChange={(id) => set('categoryId', id)} />

      {/* Место сделки：карта с выбором точки и адресом */}
      <LocationPicker
        value={{
          address: values.address,
          latitude: values.latitude,
          longitude: values.longitude,
        }}
        onChange={(location) =>
          onChange({
            ...values,
            address: location.address,
            latitude: location.latitude,
            longitude: location.longitude,
          })
        }
      />
    </>
  )
}
