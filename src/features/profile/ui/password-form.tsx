import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { usersApi } from '@/shared/api/users-api'
import { Button } from '@/shared/ui/button/button'
import { FormField } from '@/shared/ui/form-field/form-field'
import { Input } from '@/shared/ui/input/input'

const schema = z
  .object({
    currentPassword: z.string().min(1, 'Введите текущий пароль'),
    newPassword: z.string().min(8, 'Пароль должен быть не короче 8 символов'),
    repeatPassword: z.string().min(1, 'Повторите новый пароль'),
  })
  .refine((values) => values.newPassword === values.repeatPassword, {
    message: 'Пароли не совпадают',
    path: ['repeatPassword'],
  })

type FormValues = z.infer<typeof schema>

// Смена пароля родителя
export function PasswordForm() {
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  const onSubmit = async (values: FormValues) => {
    setError(null)
    setSaved(false)
    try {
      await usersApi.changePassword(values.currentPassword, values.newPassword)
      setSaved(true)
      reset()
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Не удалось изменить пароль')
    }
  }

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(event) => void handleSubmit(onSubmit)(event)}
      noValidate
    >
      <div aria-live="polite">
        {saved && <p className="text-sm text-success">Пароль изменён. Другие сессии завершены.</p>}
        {error && <p className="text-sm text-danger">{error}</p>}
      </div>

      <FormField
        name="currentPassword"
        label="Текущий пароль"
        error={errors.currentPassword?.message}
      >
        {(props) => (
          <Input
            {...props}
            type="password"
            autoComplete="current-password"
            {...register('currentPassword')}
          />
        )}
      </FormField>

      <FormField
        name="newPassword"
        label="Новый пароль"
        hint="Не короче 8 символов"
        error={errors.newPassword?.message}
      >
        {(props) => (
          <Input
            {...props}
            type="password"
            autoComplete="new-password"
            {...register('newPassword')}
          />
        )}
      </FormField>

      <FormField
        name="repeatPassword"
        label="Повторите новый пароль"
        error={errors.repeatPassword?.message}
      >
        {(props) => (
          <Input
            {...props}
            type="password"
            autoComplete="new-password"
            {...register('repeatPassword')}
          />
        )}
      </FormField>

      <Button type="submit" variant="outline" disabled={isSubmitting} className="self-start">
        {isSubmitting ? 'Меняем…' : 'Изменить пароль'}
      </Button>
    </form>
  )
}
