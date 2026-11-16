import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { z } from 'zod'

import { useForgotPassword } from '@/features/auth/model/use-auth'
import { routes } from '@/shared/config/routes'
import { Alert } from '@/shared/ui/alert/alert'
import { Button } from '@/shared/ui/button/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card/card'
import { FormField } from '@/shared/ui/form-field/form-field'
import { Input } from '@/shared/ui/input/input'

const schema = z.object({
  email: z.email('Введите корректный email'),
})

type FormValues = z.infer<typeof schema>

export default function ForgotPasswordPage() {
  const navigate = useNavigate()
  const forgot = useForgotPassword()
  const [sentTo, setSentTo] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  const onSubmit = (values: FormValues) => {
    setFormError(null)
    forgot.mutate(values.email, {
      onSuccess: () => setSentTo(values.email),
      onError: (error) => setFormError(error.message),
    })
  }

  if (sentTo) {
    return (
      <div className="mx-auto max-w-md p-8">
        <Card>
          <CardHeader>
            <CardTitle>Проверьте почту</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <Alert variant="success">
              Если аккаунт с адресом {sentTo} существует, код для сброса пароля уже отправлен.
            </Alert>
            <Button
              type="button"
              onClick={() => void navigate(routes.resetPassword, { state: { email: sentTo } })}
            >
              Ввести код
            </Button>
            <Link className="text-sm text-primary hover:underline" to={routes.login}>
              Вернуться к входу
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-md p-8">
      <Card>
        <CardHeader>
          <CardTitle>Восстановление пароля</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-sm text-text-muted">
            Укажите email, на который регистрировали аккаунт. Мы пришлём код для создания нового
            пароля.
          </p>

          <form
            className="flex flex-col gap-4"
            onSubmit={(event) => void handleSubmit(onSubmit)(event)}
            noValidate
          >
            {formError && <Alert variant="danger">{formError}</Alert>}

            <FormField name="email" label="Email" error={errors.email?.message}>
              {(props) => (
                <Input {...props} type="email" autoComplete="email" {...register('email')} />
              )}
            </FormField>

            <Button type="submit" disabled={forgot.isPending}>
              {forgot.isPending ? 'Отправляем…' : 'Получить код'}
            </Button>
          </form>

          <p className="mt-4 text-sm text-text-muted">
            Вспомнили пароль?{' '}
            <Link className="text-primary hover:underline" to={routes.login}>
              Войти
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
