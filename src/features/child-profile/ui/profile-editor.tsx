import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'
import { z } from 'zod'

import { useChildProfileMutations } from '@/features/child-profile/model/use-child-profile'
import type { ChildProfile } from '@/shared/api/children-api'
import { routes } from '@/shared/config/routes'
import { Badge } from '@/shared/ui/badge/badge'
import { Button } from '@/shared/ui/button/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card/card'
import { FormField } from '@/shared/ui/form-field/form-field'
import { Input } from '@/shared/ui/input/input'
import { Textarea } from '@/shared/ui/textarea/textarea'

const STATUS_LABEL: Record<ChildProfile['status'], string> = {
  draft: 'Черновик',
  pending_review: 'На проверке',
  active: 'Опубликован',
  blocked: 'Заблокирован',
}

const schema = z.object({
  name: z.string().min(2, 'Имя должно быть не короче 2 символов'),
  age: z
    .number({ message: 'Укажите возраст' })
    .int()
    .min(1, 'Возраст должен быть больше 0')
    .max(18, 'Не больше 18'),
  city: z.string().optional(),
  about: z.string().max(2000, 'Описание слишком длинное').optional(),
})

type FormValues = z.infer<typeof schema>

interface ProfileEditorProps {
  profile: ChildProfile | null
}

// Создание и редактирование профиля ребёнка + отправка на модерацию
export function ProfileEditor({ profile }: ProfileEditorProps) {
  const { create, update, submit } = useChildProfileMutations()
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: profile?.name ?? '',
      age: profile?.age ?? undefined,
      city: profile?.city ?? '',
      about: profile?.about ?? '',
    },
  })

  const onSubmit = async (values: FormValues) => {
    setMessage(null)
    setError(null)
    try {
      if (profile) {
        await update.mutateAsync({ id: profile.id, input: values })
      } else {
        await create.mutateAsync(values)
      }
      setMessage('Сохранено.')
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Не удалось сохранить профиль')
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-wrap items-center justify-between gap-2">
        <CardTitle>{profile ? 'Редактирование профиля' : 'Новый профиль ребёнка'}</CardTitle>
        {profile && (
          <Badge variant={profile.status === 'active' ? 'success' : 'secondary'}>
            {STATUS_LABEL[profile.status]}
          </Badge>
        )}
      </CardHeader>

      <CardContent>
        <form
          className="flex flex-col gap-4"
          onSubmit={(event) => void handleSubmit(onSubmit)(event)}
          noValidate
        >
          <div aria-live="polite">
            {message && <p className="text-sm text-success">{message}</p>}
            {error && <p className="text-sm text-danger">{error}</p>}
          </div>

          <FormField name="name" label="Имя" error={errors.name?.message}>
            {(props) => <Input {...props} {...register('name')} />}
          </FormField>

          <FormField name="age" label="Возраст" error={errors.age?.message}>
            {(props) => (
              <Input
                {...props}
                type="number"
                min={1}
                max={18}
                {...register('age', { valueAsNumber: true })}
              />
            )}
          </FormField>

          <FormField name="city" label="Город" error={errors.city?.message}>
            {(props) => <Input {...props} {...register('city')} />}
          </FormField>

          <FormField
            name="about"
            label="Описание"
            hint="Пара предложений о ребёнке и его поделках"
            error={errors.about?.message}
          >
            {(props) => <Textarea {...props} rows={4} {...register('about')} />}
          </FormField>

          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Сохраняем…' : profile ? 'Сохранить' : 'Создать профиль'}
            </Button>

            {profile && profile.status === 'draft' && (
              <Button
                type="button"
                variant="outline"
                disabled={submit.isPending}
                onClick={() =>
                  submit.mutate(profile.id, {
                    onSuccess: () => setMessage('Профиль отправлен на модерацию.'),
                    onError: (submitError) =>
                      setError(
                        submitError instanceof Error
                          ? submitError.message
                          : 'Не удалось отправить на модерацию',
                      ),
                  })
                }
              >
                Отправить на модерацию
              </Button>
            )}

            {profile && profile.status === 'active' && (
              <Button asChild variant="outline">
                <Link to={routes.seller(profile.slug)}>Открыть публичную страницу</Link>
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
