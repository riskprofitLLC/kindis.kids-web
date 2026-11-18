import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { useAddresses } from '@/features/profile/model/use-addresses'
import { Button } from '@/shared/ui/button/button'
import { FormField } from '@/shared/ui/form-field/form-field'
import { Input } from '@/shared/ui/input/input'

// Название，город，улица и дом обязательны；индекс — шесть цифр，если указан.
const addressSchema = z.object({
  label: z.string().trim().min(1, 'Укажите название'),
  city: z.string().trim().min(1, 'Укажите город'),
  street: z.string().trim().min(1, 'Укажите улицу'),
  house: z.string().trim().min(1, 'Укажите дом'),
  apartment: z.string().trim(),
  zip: z
    .string()
    .trim()
    .refine((value) => value === '' || /^\d{6}$/.test(value), 'Индекс — 6 цифр'),
})

type AddressValues = z.infer<typeof addressSchema>

const emptyValues: AddressValues = {
  label: '',
  city: '',
  street: '',
  house: '',
  apartment: '',
  zip: '',
}

// Адресная книга：сохранённые адреса покупателя для оформления заказа.
export function AddressBook() {
  const { items, add, remove } = useAddresses()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AddressValues>({
    resolver: zodResolver(addressSchema),
    defaultValues: emptyValues,
  })

  return (
    <div className="flex flex-col gap-3">
      {items.length === 0 ? (
        <p className="text-sm text-text-muted">Сохранённых адресов пока нет.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-card border border-border p-3 text-sm"
            >
              <span className="text-text">
                {item.label}: {item.city}, {item.street}, {item.house}
                {item.apartment ? `, кв. ${item.apartment}` : ''}
              </span>
              <Button type="button" variant="ghost" size="sm" onClick={() => remove(item.id)}>
                Удалить
              </Button>
            </li>
          ))}
        </ul>
      )}

      {/* Форма добавления — компактная сетка */}
      <form
        className="grid gap-2 sm:grid-cols-2"
        onSubmit={(event) => {
          void handleSubmit((values) => {
            add(values)
            reset(emptyValues)
          })(event)
        }}
      >
        <FormField name="label" label="Название" error={errors.label?.message}>
          {(props) => (
            <Input {...props} {...register('label')} placeholder="Дом，работа" />
          )}
        </FormField>

        <FormField name="city" label="Город" error={errors.city?.message}>
          {(props) => (
            <Input {...props} {...register('city')} autoComplete="address-level2" />
          )}
        </FormField>

        <FormField name="street" label="Улица" error={errors.street?.message}>
          {(props) => (
            <Input {...props} {...register('street')} autoComplete="address-level1" />
          )}
        </FormField>

        <div className="grid grid-cols-3 gap-2">
          <FormField name="house" label="Дом" error={errors.house?.message}>
            {(props) => <Input {...props} {...register('house')} />}
          </FormField>

          <FormField name="apartment" label="Квартира" error={errors.apartment?.message}>
            {(props) => <Input {...props} {...register('apartment')} />}
          </FormField>

          <FormField name="zip" label="Индекс" error={errors.zip?.message}>
            {(props) => (
              <Input
                {...props}
                {...register('zip')}
                inputMode="numeric"
                autoComplete="postal-code"
              />
            )}
          </FormField>
        </div>

        <Button type="submit" className="self-start">
          Добавить адрес
        </Button>
      </form>
    </div>
  )
}