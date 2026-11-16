import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { z } from 'zod'

import { useResetPassword } from '@/features/auth/model/use-auth'
import { routes } from '@/shared/config/routes'
import { Alert } from '@/shared/ui/alert/alert'
import { Button } from '@/shared/ui/button/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card/card'
import { FormField } from '@/shared/ui/form-field/form-field'
import { Input } from '@/shared/ui/input/input'

const schema = z
  .object({
    email: z.email('Введите корректный email'),
    code: z.string().length(6, 'Код состоит из 6 символов'),
    password: z.string().min(8, 'Пароль должен быть не короче 8 символов'),
    repeatPassword: z.string().min(1, 'Повторите новый пароль'),
  })
  .refine((values) => values.password === values.repeatPassword, {
    message: 'Пароли не совпадают',
    path: ['repeatPassword'],
  })

type FormValues = z.infer<typeof schema>

export default function ResetPasswordPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const reset = useResetPassword()
  const [formError, setFormError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  const presetEmail = (location.state as { email?: string } | null)?.email ?? ''

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: presetEmail, code: '', password: '' },
  })

  const onSubmit = (values: FormValues) => {
    setFormError(null)
    reset.mutate(values, {
      onSuccess: () => setDone(true),
      onError: (error) => setFormError(error.message),
    })
  }

  if (done) {
    return (
      <div className="mx-auto max-w-md p-8">
        <Card>
          <CardHeader>
            <CardTitle>Пароль изменён</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <Alert variant="success">
              Новый пароль сохранён. Все прежние сессии завершены — войдите заново.
            </Alert>
            <Button type="button" onClick={() => void navigate(routes.login, { replace: true })}>
              Перейти к входу
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-md p-8">
      <Card>
        <CardHeader>
          <CardTitle>Сброс пароля</CardTitle>
        </CardHeader>
        <CardContent>
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

            <FormField name="code" label="Код из письма" hint="6 цифр" error={errors.code?.message}>
              {(props) => (
                <Input
                  {...props}
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="123456"
                  {...register('code')}
                />
              )}
            </FormField>

            <FormField
              name="password"
              label="Новый пароль"
              hint="Не короче 8 символов"
              error={errors.password?.message}
            >
              {(props) => (
                <Input
                  {...props}
                  type="password"
                  autoComplete="new-password"
                  {...register('password')}
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

            <Button type="submit" disabled={reset.isPending}>
              {reset.isPending ? 'Сохраняем…' : 'Сохранить пароль'}
            </Button>
          </form>

          <p className="mt-4 text-sm text-text-muted">
            Код не пришёл?{' '}
            <Link className="text-primary hover:underline" to={routes.forgotPassword}>
              Запросить новый
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
