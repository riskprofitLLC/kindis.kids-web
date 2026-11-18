import * as Tabs from '@radix-ui/react-tabs'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'

import { adminApi } from '@/shared/api/admin-api'
import { ApiError } from '@/shared/api/errors'
import { Alert } from '@/shared/ui/alert/alert'
import { Button } from '@/shared/ui/button/button'
import { Dialog } from '@/shared/ui/dialog/dialog'
import { FormField } from '@/shared/ui/form-field/form-field'
import { Skeleton } from '@/shared/ui/skeleton/skeleton'
import { LoadingRegion } from '@/shared/ui/skeleton/skeleton-loading-region'
import { Textarea } from '@/shared/ui/textarea/textarea'

import { describeRow, type QueueKind, QUEUES } from './moderation-row'

type ModerationAction = 'approve' | 'reject' | 'block'

interface PendingAction {
  id: string
  action: 'reject' | 'block'
}

function errorText(error: unknown): string {
  return error instanceof ApiError ? error.message : 'Попробуйте ещё раз.'
}

export default function ModerationPage() {
  const [kind, setKind] = useState<QueueKind>('profiles')
  const [pending, setPending] = useState<PendingAction | null>(null)
  const [reason, setReason] = useState('')
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

  // Действия над контентом: одобрение сразу, отклонение и блок — через диалог с причиной.
  const act = useMutation({
    mutationFn: (vars: {
      targetKind: string
      id: string
      action: ModerationAction
      reason?: string
    }) =>
      vars.reason
        ? adminApi.act(vars.targetKind, vars.id, vars.action, vars.reason)
        : adminApi.act(vars.targetKind, vars.id, vars.action),
    onSuccess: () => {
      closeConfirm()
      void queryClient.invalidateQueries({ queryKey: ['moderation'] })
    },
  })

  // Жалобы не модерируются как контент — их закрывают резолюцией.
  const resolveReport = useMutation({
    mutationFn: (vars: { id: string; status: 'resolved' | 'rejected' }) =>
      adminApi.resolveReport(vars.id, vars.status),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['moderation'] })
    },
  })

  function openConfirm(id: string, action: PendingAction['action']) {
    setPending({ id, action })
    setReason('')
  }

  function closeConfirm() {
    setPending(null)
    setReason('')
  }

  function submitConfirm() {
    if (!pending) return
    const trimmed = reason.trim()
    act.mutate({
      targetKind: kind,
      id: pending.id,
      action: pending.action,
      ...(trimmed ? { reason: trimmed } : {}),
    })
  }

  const rows = (queue.data ?? []) as Array<Record<string, unknown>>
  const isReports = kind === 'reports'

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold text-text">Модерация</h1>

      <Tabs.Root
        value={kind}
        onValueChange={(value) => setKind(value as QueueKind)}
        className="flex flex-col gap-4"
      >
        <Tabs.List className="flex flex-wrap gap-2" aria-label="Очереди модерации">
          {QUEUES.map((item) => (
            <Tabs.Trigger
              key={item.kind}
              value={item.kind}
              className={`min-h-11 rounded-md border px-3 text-sm ${
                kind === item.kind ? 'border-primary text-primary' : 'border-border text-text-muted'
              }`}
            >
              {item.label}
            </Tabs.Trigger>
          ))}
        </Tabs.List>

        <Tabs.Content value={kind} className="flex flex-col gap-4">
          {/* Ошибку диалога показываем внутри него — алерт иначе уходит под оверлей */}
          {act.isError && pending === null && (
            <Alert variant="danger" title="Действие не выполнено">
              {errorText(act.error)}
            </Alert>
          )}

          {resolveReport.isError && (
            <Alert variant="danger" title="Жалоба не закрыта">
              {errorText(resolveReport.error)}
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
              const view = describeRow(kind, row)
              const id = typeof row.id === 'string' ? row.id : ''

              return (
                <li
                  key={id || view.title}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-card border border-border p-3"
                >
                  <div className="flex min-w-0 flex-col gap-0.5">
                    <span className="text-sm text-text">{view.title}</span>
                    {view.lines.map((line) => (
                      <span key={line} className="text-xs text-text-muted">
                        {line}
                      </span>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    {isReports ? (
                      <>
                        <Button
                          type="button"
                          size="sm"
                          disabled={resolveReport.isPending}
                          onClick={() => resolveReport.mutate({ id, status: 'resolved' })}
                        >
                          Решить
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={resolveReport.isPending}
                          onClick={() => resolveReport.mutate({ id, status: 'rejected' })}
                        >
                          Отклонить жалобу
                        </Button>
                      </>
                    ) : (
                      <>
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
                          onClick={() => openConfirm(id, 'reject')}
                        >
                          Отклонить
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="danger"
                          disabled={act.isPending}
                          onClick={() => openConfirm(id, 'block')}
                        >
                          Заблокировать
                        </Button>
                      </>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        </Tabs.Content>
      </Tabs.Root>

      <Dialog
        open={pending !== null}
        onOpenChange={(open) => {
          if (!open) closeConfirm()
        }}
        title={pending?.action === 'block' ? 'Заблокировать?' : 'Отклонить?'}
        description={
          pending?.action === 'block'
            ? 'Блокировка необратима для автора: объект исчезнет из выдачи.'
            : 'Автор получит отклонение и сможет исправить объект.'
        }
      >
        {act.isError && <p className="text-xs text-danger">{errorText(act.error)}</p>}

        <FormField name="reason" label="Причина (необязательно)">
          {(props) => (
            <Textarea
              {...props}
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Например: нарушение правил маркетплейса"
            />
          )}
        </FormField>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={closeConfirm}>
            Отмена
          </Button>
          <Button
            type="button"
            variant={pending?.action === 'block' ? 'danger' : 'default'}
            disabled={act.isPending}
            onClick={submitConfirm}
          >
            {pending?.action === 'block' ? 'Заблокировать' : 'Отклонить'}
          </Button>
        </div>
      </Dialog>
    </div>
  )
}
