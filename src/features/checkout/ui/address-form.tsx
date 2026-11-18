import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import type { DeliveryMethod } from '@/shared/domain/cart'
import { Button } from '@/shared/ui/button/button'
import { FormField } from '@/shared/ui/form-field/form-field'
import { Input } from '@/shared/ui/input/input'

// Почта требует полный адрес；self-вывоз и договорённость — нет.
const postAddressSchema = z.object({
  fullName: z.string().trim().min(1, 'Укажите имя и фамилию'),
  phone: z
    .string()
    .trim()
    .min(1, 'Укажите телефон')
    .regex(/^[\d+()\-\s]{10,}$/, 'Похоже на некорректный телефон'),
  city: z.string().trim().min(1, 'Укажите город'),
  street: z.string().trim().min(1, 'Укажите улицу'),
  house: z.string().trim().min(1, 'Укажите дом'),
  apartment: z.string().trim().optional(),
  zip: z
    .string()
    .trim()
    .regex(/^\d{6}$/, 'Индекс — 6 цифр'),
})

export type AddressValues = z.infer<typeof postAddressSchema>

interface AddressFormProps {
  method: DeliveryMethod
  onSubmit: (values: AddressValues) => void
}

// Форма адреса:для почты — полная,для остальных способов поля скрыты.
export function AddressForm({ method, onSubmit }: AddressFormProps) {
  const isPost = method === 'post'

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AddressValues>({
    resolver: zodResolver(postAddressSchema),
  })

  if (!isPost) {
    return (
      <p className="text-sm text-text-muted">
        Для этого способа доставки адрес не нужен — детали вы договоруетесь с продавцом в чате
        заказа.
      </p>
    )
  }

  return (
    <form
      className="grid gap-3 sm:grid-cols-2"
      onSubmit={(event) => {
        void handleSubmit(onSubmit)(event)
      }}
    >
      <FormField name="fullName" label="Имя и фамилия" error={errors.fullName?.message}>
        {(props) => (
          <Input
            {...props}
            {...register('fullName')}
            autoComplete="name"
            placeholder="Мария Иванова"
          />
        )}
      </FormField>

      <FormField name="phone" label="Телефон" error={errors.phone?.message}>
        {(props) => (
          <Input
            {...props}
            {...register('phone')}
            type="tel"
            autoComplete="tel"
            placeholder="+7 900 000-00-00"
          />
        )}
      </FormField>

      <FormField name="city" label="Город" error={errors.city?.message}>
        {(props) => <Input {...props} {...register('city')} autoComplete="address-level2" />}
      </FormField>

      <FormField name="street" label="Улица" error={errors.street?.message}>
        {(props) => <Input {...props} {...register('street')} autoComplete="address-level1" />}
      </FormField>

      <div className="grid grid-cols-3 gap-3">
        <FormField name="house" label="Дом" error={errors.house?.message}>
          {(props) => <Input {...props} {...register('house')} />}
        </FormField>

        <FormField name="apartment" label="Квартира" error={errors.apartment?.message}>
          {(props) => <Input {...props} {...register('apartment')} />}
        </FormField>

        <FormField name="zip" label="Индекс" error={errors.zip?.message}>
          {(props) => (
            <Input {...props} {...register('zip')} inputMode="numeric" autoComplete="postal-code" />
          )}
        </FormField>
      </div>

      <Button type="submit" className="sm:col-span-2">
        Далее
      </Button>
    </form>
  )
}
