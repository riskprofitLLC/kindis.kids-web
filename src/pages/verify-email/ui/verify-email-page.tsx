import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { z } from 'zod'

import { useVerifyEmail } from '@/features/auth/model/use-auth'
import { routes } from '@/shared/config/routes'
import { Alert } from '@/shared/ui/alert/alert'
import { Button } from '@/shared/ui/button/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card/card'
import { FormField } from '@/shared/ui/form-field/form-field'
import { Input } from '@/shared/ui/input/input'

const schema = z.object({
  email: z.email('Введите корректный email'),
  code: z.string().length(6, 'Код состоит из 6 символов'),
})

type FormValues = z.infer<typeof schema>

export default function VerifyEmailPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const verify = useVerifyEmail()
  const [formError, setFormError] = useState<string | null>(null)

  const presetEmail = (location.state as { email?: string } | null)?.email ?? ''

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: presetEmail, code: '' },
  })

  const onSubmit = (values: FormValues) => {
    setFormError(null)
    verify.mutate(values, {
      onSuccess: () => void navigate(routes.cabinet, { replace: true }),
      onError: (error) => setFormError(error.message),
    })
  }

  return (
    <div className="mx-auto max-w-md p-8">
      <Card>
        <CardHeader>
          <CardTitle>Подтверждение email</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-sm text-text-muted">
            Мы отправили шестизначный код на указанную почту. Введите его, чтобы активировать
            аккаунт.
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

            <Button type="submit" disabled={verify.isPending}>
              {verify.isPending ? 'Проверяем…' : 'Подтвердить'}
            </Button>
          </form>

          <p className="mt-4 text-sm text-text-muted">
            Код не пришёл? Проверьте папку «Спам» или{' '}
            <Link className="text-primary hover:underline" to={routes.login}>
              вернитесь к входу
            </Link>
            .
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
