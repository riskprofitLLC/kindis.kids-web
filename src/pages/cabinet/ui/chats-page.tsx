import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'

import { ChatConversation } from '@/features/chat/ui/chat-conversation'
import { sellerApi } from '@/shared/api/seller-api'
import { cn } from '@/shared/lib/cn'
import { Skeleton } from '@/shared/ui/skeleton/skeleton'
import { LoadingRegion } from '@/shared/ui/skeleton/skeleton-loading-region'

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

      {dialogs.isPending && (
        <LoadingRegion>
          <Skeleton className="h-24 w-full" />
        </LoadingRegion>
      )}

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
          <ChatConversation orderId={activeOrderId} />
        ) : (
          <p className="text-sm text-text-muted">Выберите диалог слева.</p>
        )}
      </div>
    </div>
  )
}

