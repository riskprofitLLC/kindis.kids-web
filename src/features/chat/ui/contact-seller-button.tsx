import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'

import { useSessionStore } from '@/entities/session/model/session-store'
import { useProductOrders } from '@/features/chat/model/use-seller-chat'
import { ChatConversation } from '@/features/chat/ui/chat-conversation'
import { routes } from '@/shared/config/routes'
import { Button } from '@/shared/ui/button/button'
import { Dialog } from '@/shared/ui/dialog/dialog'
import { Skeleton } from '@/shared/ui/skeleton/skeleton'

interface ContactSellerButtonProps {
  productId: string
  sellerName?: string
}

// Кнопка «Написать продавцу»:гостей отправляем на вход,покупателю
// открываем диалог по его заказу с этим товаром.
export function ContactSellerButton({ productId, sellerName }: ContactSellerButtonProps) {
  const status = useSessionStore((state) => state.status)
  const navigate = useNavigate()
  const location = useLocation()
  const [open, setOpen] = useState(false)

  const orders = useProductOrders(productId, open)

  if (status !== 'authenticated') {
    return (
      <Button
        type="button"
        variant="outline"
        onClick={() => void navigate(routes.login, { state: { from: location.pathname } })}
      >
        Написать продавцу
      </Button>
    )
  }

  const order = orders.data?.[0]

  return (
    <>
      <Button type="button" variant="outline" onClick={() => setOpen(true)}>
        Написать продавцу
      </Button>

      <Dialog
        open={open}
        onOpenChange={setOpen}
        title={sellerName ? `Чат с ${sellerName}` : 'Чат с продавцом'}
        description="Переписка идёт по заказу — так видны и товар,и детали сделки."
      >
        {orders.isPending && <Skeleton className="h-24 w-full" />}

        {!orders.isPending && !order && (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-text-muted">
              Диалог с продавцом открывается по заказу. Добавьте товар в корзину и оформите заказ —
              чат появится здесь.
            </p>
            <Button asChild>
              <Link to={routes.catalog}>Открыть каталог</Link>
            </Button>
          </div>
        )}

        {order && <ChatConversation orderId={order.id} />}
      </Dialog>
    </>
  )
}
