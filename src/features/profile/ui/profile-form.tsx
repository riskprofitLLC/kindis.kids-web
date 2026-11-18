import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { usersApi } from '@/shared/api/users-api'
import type { User } from '@/shared/domain/user'
import { Button } from '@/shared/ui/button/button'
import { FormField } from '@/shared/ui/form-field/form-field'
import { Input } from '@/shared/ui/input/input'

const schema = z.object({
  fullName: z.string().min(2, 'Имя должно быть не короче 2 символов'),
  phone: z
    .string()
    .regex(/^\+?[\d\s()-]{5,20}$/, 'Проверьте формат телефона')
    .or(z.literal('')),
  city: z.string().min(2, 'Укажите город').or(z.literal('')),
})

type FormValues = z.infer<typeof schema>

interface ProfileFormProps {
  user: User
  onSaved: (values: Partial<User>) => void
}

// Имя, телефон и город родителя
export function ProfileForm({ user, onSaved }: ProfileFormProps) {
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      fullName: user.fullName ?? '',
      phone: user.phone ?? '',
      city: user.city ?? '',
    },
  })

  const onSubmit = async (values: FormValues) => {
    setError(null)
    setSaved(false)
    try {
      await usersApi.updateProfile(values)
      onSaved({ ...values })
      setSaved(true)
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Не удалось сохранить данные')
    }
  }

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(event) => void handleSubmit(onSubmit)(event)}
      noValidate
    >
      <p className="text-sm text-text-muted">
        Email для входа: <span className="text-text">{user.email}</span>
      </p>

      <div aria-live="polite">
        {saved && <p className="text-sm text-success">Данные сохранены.</p>}
        {error && <p className="text-sm text-danger">{error}</p>}
      </div>

      <FormField name="fullName" label="Имя" error={errors.fullName?.message}>
        {(props) => <Input {...props} autoComplete="name" {...register('fullName')} />}
      </FormField>

      <FormField name="phone" label="Телефон" error={errors.phone?.message}>
        {(props) => <Input {...props} type="tel" autoComplete="tel" {...register('phone')} />}
      </FormField>

      <FormField name="city" label="Город" error={errors.city?.message}>
        {(props) => <Input {...props} autoComplete="address-level2" {...register('city')} />}
      </FormField>

      <Button type="submit" disabled={isSubmitting} className="self-start">
        {isSubmitting ? 'Сохраняем…' : 'Сохранить'}
      </Button>
    </form>
  )
}
