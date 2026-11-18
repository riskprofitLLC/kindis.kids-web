import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'

import { adminApi } from '@/shared/api/admin-api'
import { ApiError } from '@/shared/api/errors'
import { Alert } from '@/shared/ui/alert/alert'
import { Button } from '@/shared/ui/button/button'
import { Skeleton } from '@/shared/ui/skeleton/skeleton'
import { LoadingRegion } from '@/shared/ui/skeleton/skeleton-loading-region'

// Очередь модерации:профили,товары,медиа,отзывы,жалобы.
type QueueKind = 'profiles' | 'products' | 'media' | 'reviews' | 'reports'

const QUEUES: Array<{ kind: QueueKind; label: string }> = [
  { kind: 'profiles', label: 'Профили' },
  { kind: 'products', label: 'Товары' },
  { kind: 'media', label: 'Медиа' },
  { kind: 'reviews', label: 'Отзывы' },
  { kind: 'reports', label: 'Жалобы' },
]

export default function ModerationPage() {
  const [kind, setKind] = useState<QueueKind>('profiles')
  const queryClient = useQueryClient()

  const queue = useQuery({
    queryKey: ['moderation', kind],
    queryFn: () => {
      if (kind === 'profiles') return adminApi.profiles()
      if (kind === 'products') return adminApi.products()
      if (kind === 'media') return adminApi.media()
      if (kind === 'reviews') return adminApi.reviews()
      return adminApi.reports()
    },
  })

  const act = useMutation({
    mutationFn: ({
      targetKind,
      id,
      action,
    }: {
      targetKind: string
      id: string
      action: 'approve' | 'reject' | 'block'
    }) => adminApi.act(targetKind, id, action),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['moderation'] })
    },
  })

  const rows = (queue.data ?? []) as Array<Record<string, unknown>>

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold text-text">Модерация</h1>

      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Очереди модерации">
        {QUEUES.map((queue_) => (
          <button
            key={queue_.kind}
            type="button"
            role="tab"
            aria-selected={kind === queue_.kind}
            className={`min-h-11 rounded-md border px-3 text-sm ${
              kind === queue_.kind ? 'border-primary text-primary' : 'border-border text-text-muted'
            }`}
            onClick={() => setKind(queue_.kind)}
          >
            {queue_.label}
          </button>
        ))}
      </div>

      {act.isError && (
        <Alert variant="danger" title="Действие не выполнено">
          {act.error instanceof ApiError ? act.error.message : 'Попробуйте ещё раз.'}
        </Alert>
      )}

      {queue.isPending && (
        <LoadingRegion>
          <Skeleton className="h-24 w-full" />
        </LoadingRegion>
      )}

      {!queue.isPending && rows.length === 0 && (
        <p className="text-sm text-text-muted">Очередь пуста — всё разобрано.</p>
      )}

      <ul className="flex flex-col gap-2">
        {rows.map((row) => {
          // Поля очереди бывают разными（профиль/товар/отзыв）— берём первое непустое.
          const id = typeof row.id === 'string' ? row.id : ''
          const rawTitle = [row.title, row.name, row.slug].find(
            (field) => typeof field === 'string' && field.length > 0,
          )
          const title = typeof rawTitle === 'string' ? rawTitle : id

          return (
            <li
              key={id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-card border border-border p-3"
            >
              <span className="text-sm text-text">{title}</span>
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  disabled={act.isPending}
                  onClick={() => act.mutate({ targetKind: kind, id, action: 'approve' })}
                >
                  Одобрить
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={act.isPending}
                  onClick={() => act.mutate({ targetKind: kind, id, action: 'reject' })}
                >
                  Отклонить
                </Button>
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
