import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { z } from 'zod'

import { useLogin } from '@/features/auth/model/use-auth'
import { isApiError } from '@/shared/api/errors'
import { routes } from '@/shared/config/routes'
import { Alert } from '@/shared/ui/alert/alert'
import { Button } from '@/shared/ui/button/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card/card'
import { FormField } from '@/shared/ui/form-field/form-field'
import { Input } from '@/shared/ui/input/input'

const schema = z.object({
  email: z.email('Введите корректный email'),
  password: z.string().min(1, 'Введите пароль'),
})

type FormValues = z.infer<typeof schema>

// Вход родителя: центрированная карточка, поля столбиком, кнопка на всю ширину.
export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const login = useLogin()
  const [formError, setFormError] = useState<string | null>(null)

  const from = (location.state as { from?: string } | null)?.from

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  const onSubmit = (values: FormValues) => {
    setFormError(null)
    login.mutate(values, {
      onSuccess: () => void navigate(from ?? routes.cabinet, { replace: true }),
      onError: (error) => {
        if (isApiError(error) && error.code === 'AUTH_EMAIL_NOT_VERIFIED') {
          void navigate(routes.verifyEmail, { state: { email: values.email }, replace: true })
          return
        }
        setFormError(error.message)
      },
    })
  }

  return (
    <div className="mx-auto w-full max-w-md px-4 py-6 sm:mt-10 sm:p-8">
      <Card>
        <CardHeader>
          <CardTitle>Вход</CardTitle>
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
                <Input
                  {...props}
                  type="email"
                  autoComplete="email"
                  placeholder="parent@example.com"
                  {...register('email')}
                />
              )}
            </FormField>

            <FormField name="password" label="Пароль" error={errors.password?.message}>
              {(props) => (
                <Input
                  {...props}
                  type="password"
                  autoComplete="current-password"
                  {...register('password')}
                />
              )}
            </FormField>

            <Button type="submit" className="w-full" disabled={login.isPending}>
              {login.isPending ? 'Входим…' : 'Войти'}
            </Button>
          </form>

          <div className="mt-4 flex flex-col gap-2 text-sm">
            <Link className="inline-flex min-h-[44px] items-center text-primary hover:underline" to={routes.forgotPassword}>
              Забыли пароль?
            </Link>
            <p className="text-text-muted">
              Нет аккаунта?{' '}
              <Link className="inline-flex min-h-[44px] items-center text-primary hover:underline" to={routes.register}>
                Зарегистрироваться
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}