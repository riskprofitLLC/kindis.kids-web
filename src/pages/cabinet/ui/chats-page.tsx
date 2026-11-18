import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'

import { useSessionStore } from '@/entities/session/model/session-store'
import { sellerApi } from '@/shared/api/seller-api'
import { cn } from '@/shared/lib/cn'
import { Button } from '@/shared/ui/button/button'
import { Skeleton } from '@/shared/ui/skeleton/skeleton'

// Чаты по заказам: список диалогов, переписка, непрочитанные.
// Реального времени нет - опрашиваем раз в 5 секунд.
const POLL_MS = 5000

export default function ChatsPage() {
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null)

  const dialogs = useQuery({
    queryKey: ['dialogs'],
    queryFn: () => sellerApi.dialogs(),
    refetchInterval: POLL_MS,
  })

  const items = dialogs.data ?? []

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold text-text">Чаты по заказам</h1>

      {dialogs.isPending && <Skeleton className="h-24 w-full" />}

      {!dialogs.isPending && items.length === 0 && (
        <p className="text-sm text-text-muted">
          Диалогов пока нет - они появятся, когда покупатели напишут по заказам.
        </p>
      )}

      <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
        <ul className="flex flex-col gap-2">
          {items.map((dialog) => (
            <li key={dialog.orderId}>
              <button
                type="button"
                className={cn(
                  'w-full rounded-md border px-3 py-2 text-left text-sm',
                  activeOrderId === dialog.orderId
                    ? 'border-primary bg-surface-muted'
                    : 'border-border hover:bg-surface-muted',
                )}
                onClick={() => setActiveOrderId(dialog.orderId)}
              >
                <span className="font-medium text-text">{dialog.counterpartName}</span>
                {dialog.unreadCount > 0 && (
                  <span className="ml-2 rounded-full bg-primary px-2 text-xs text-primary-foreground">
                    {dialog.unreadCount}
                  </span>
                )}
                <span className="block truncate text-xs text-text-muted">
                  {dialog.lastMessage?.text ?? 'Сообщений пока нет'}
                </span>
              </button>
            </li>
          ))}
        </ul>

        {activeOrderId ? (
          <Conversation orderId={activeOrderId} />
        ) : (
          <p className="text-sm text-text-muted">Выберите диалог слева.</p>
        )}
      </div>
    </div>
  )
}

// Переписка по заказу: опрос раз в 5 секунд, отметка о прочтении при открытии.
function Conversation({ orderId }: { orderId: string }) {
  const queryClient = useQueryClient()
  const userId = useSessionStore((state) => state.user?.id)

  const messages = useQuery({
    queryKey: ['messages', orderId],
    queryFn: () => sellerApi.messages(orderId),
    refetchInterval: POLL_MS,
  })

  // При открытии диалога помечаем прочитанным.
  useEffect(() => {
    void sellerApi.markRead(orderId).then(() => {
      void queryClient.invalidateQueries({ queryKey: ['dialogs'] })
    })
  }, [orderId, queryClient])

  if (messages.isPending) {
    return <Skeleton className="h-24 w-full" />
  }

  const items = messages.data ?? []

  return (
    <div className="flex flex-col gap-3 rounded-card border border-border p-3">
      <ul className="flex max-h-96 flex-col gap-2 overflow-y-auto">
        {items.map((message) => (
          <li
            key={message.id}
            className={cn(
              'max-w-[85%] rounded-card px-3 py-2 text-sm text-text',
              message.senderId === userId
                ? 'self-end bg-primary/10'
                : 'self-start bg-surface-muted',
            )}
          >
            <span className="block text-xs text-text-muted">
              {message.sender?.fullName ?? 'Собеседник'}
            </span>
            {message.text}
          </li>
        ))}
      </ul>

      <form
        className="flex gap-2"
        onSubmit={(event) => {
          event.preventDefault()
          const form = event.currentTarget
          const input = form.elements.namedItem('draft') as HTMLInputElement | null
          const text = input?.value.trim() ?? ''
          if (!text) return
          void sellerApi.sendMessage(orderId, text).then(() => {
            void queryClient.invalidateQueries({ queryKey: ['messages', orderId] })
            if (input) input.value = ''
          })
        }}
      >
        <input
          name="draft"
          aria-label="Текст сообщения"
          className="min-h-11 flex-1 rounded-md border border-border px-3 text-sm"
          placeholder="Написать сообщение"
        />
        <Button type="submit" size="sm">
          Отправить
        </Button>
      </form>
    </div>
  )
}
