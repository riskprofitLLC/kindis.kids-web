import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'

import { useSessionStore } from '@/entities/session/model/session-store'
import { sellerApi } from '@/shared/api/seller-api'
import { cn } from '@/shared/lib/cn'
import { Button } from '@/shared/ui/button/button'
import { Skeleton } from '@/shared/ui/skeleton/skeleton'
import { LoadingRegion } from '@/shared/ui/skeleton/skeleton-loading-region'

// Реального времени нет - опрашиваем переписку раз в 5 секунд.
const POLL_MS = 5000

interface ChatConversationProps {
  orderId: string
}

// Переписка по заказу: лента сообщений, отправка, отметка о прочтении при открытии.
// Свои сообщения визуально отделены - как в чатах Авито.
export function ChatConversation({ orderId }: ChatConversationProps) {
  const queryClient = useQueryClient()
  // Свои сообщения определяем по автору, а не по флагу ответа.
  const userId = useSessionStore((state) => state.user?.id)
  const [draft, setDraft] = useState('')

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

  const send = useMutation({
    mutationFn: (text: string) => sellerApi.sendMessage(orderId, text),
    onSuccess: () => {
      setDraft('')
      void queryClient.invalidateQueries({ queryKey: ['messages', orderId] })
    },
  })

  if (messages.isPending) {
    return (
      <LoadingRegion>
        <Skeleton className="h-24 w-full" />
      </LoadingRegion>
    )
  }

  const items = messages.data ?? []

  return (
    <div className="flex flex-col gap-3">
      <ul className="flex max-h-72 flex-col gap-2 overflow-y-auto">
        {items.map((message) => (
          <li
            key={message.id}
            className={cn(
              'max-w-[85%] rounded-card px-3 py-2 text-sm',
              message.senderId === userId
                ? 'self-end bg-primary/10 text-text'
                : 'self-start bg-surface-muted text-text',
            )}
          >
            <span className="block text-xs text-text-muted">
              {message.sender?.fullName ?? 'Собеседник'}
            </span>
            {message.text}
          </li>
        ))}
        {items.length === 0 && (
          <li className="text-sm text-text-muted">Сообщений пока нет - напишите первым.</li>
        )}
      </ul>

      <form
        className="flex gap-2"
        onSubmit={(event) => {
          event.preventDefault()
          const text = draft.trim()
          if (!text) return
          send.mutate(text)
        }}
      >
        <input
          aria-label="Текст сообщения"
          className="min-h-11 flex-1 rounded-md border border-border px-3 text-sm"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Написать сообщение"
        />
        <Button type="submit" size="sm" disabled={send.isPending}>
          Отправить
        </Button>
      </form>
    </div>
  )
}
