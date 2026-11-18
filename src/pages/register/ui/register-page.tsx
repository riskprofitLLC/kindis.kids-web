import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { z } from 'zod'

import { useRegister } from '@/features/auth/model/use-auth'
import { routes } from '@/shared/config/routes'
import { Alert } from '@/shared/ui/alert/alert'
import { Button } from '@/shared/ui/button/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card/card'
import { FormField } from '@/shared/ui/form-field/form-field'
import { Input } from '@/shared/ui/input/input'

const schema = z.object({
  fullName: z.string().min(2, 'Имя должно быть не короче 2 символов'),
  email: z.email('Введите корректный email'),
  password: z.string().min(8, 'Пароль должен быть не короче 8 символов'),
})

type FormValues = z.infer<typeof schema>

// Регистрация родителя: центрированная карточка, поля столбиком, кнопка на всю ширину.
export default function RegisterPage() {
  const navigate = useNavigate()
  const register_ = useRegister()
  const [formError, setFormError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  const onSubmit = (values: FormValues) => {
    setFormError(null)
    register_.mutate(values, {
      onSuccess: () =>
        void navigate(routes.verifyEmail, { state: { email: values.email }, replace: true }),
      onError: (error) => setFormError(error.message),
    })
  }

  return (
    <div className="mx-auto mt-10 max-w-md p-8">
      <Card>
        <CardHeader>
          <CardTitle>Регистрация родителя</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="flex flex-col gap-4"
            onSubmit={(event) => void handleSubmit(onSubmit)(event)}
            noValidate
          >
            {formError && <Alert variant="danger">{formError}</Alert>}

            <FormField name="fullName" label="Как вас зовут" error={errors.fullName?.message}>
              {(props) => (
                <Input
                  {...props}
                  autoComplete="name"
                  placeholder="Мария Иванова"
                  {...register('fullName')}
                />
              )}
            </FormField>

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

            <FormField
              name="password"
              label="Пароль"
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

            <Button type="submit" className="w-full" disabled={register_.isPending}>
              {register_.isPending ? 'Создаём…' : 'Зарегистрироваться'}
            </Button>
          </form>

          <p className="mt-4 text-sm text-text-muted">
            Уже есть аккаунт?{' '}
            <Link className="text-primary hover:underline" to={routes.login}>
              Войти
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
