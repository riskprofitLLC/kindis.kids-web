import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import { useCancelOrder, useOrder } from '@/features/orders/model/use-orders'
import { ApiError } from '@/shared/api/errors'
import { BUYER_CANCELABLE, ORDER_STATUS_LABELS } from '@/shared/api/orders-api'
import { routes } from '@/shared/config/routes'
import { formatDate, formatPrice } from '@/shared/lib/format'
import { Alert } from '@/shared/ui/alert/alert'
import { Badge } from '@/shared/ui/badge/badge'
import { Button } from '@/shared/ui/button/button'
import { Skeleton } from '@/shared/ui/skeleton/skeleton'

// Детали заказа：состав，адрес，статус，отмена в допустимых статусах.
export default function OrderDetailPage() {
  const { orderId = '' } = useParams()
  const order = useOrder(orderId)
  const cancel = useCancelOrder()
  const [reason, setReason] = useState('')

  if (order.isPending) {
    return <Skeleton className="h-40 w-full" />
  }

  if (order.isError || !order.data) {
    return (
      <Alert variant="danger" title="Заказ не найден">
        Вернитесь в{' '}
        <Link className="text-primary hover:underline" to={routes.cabinetOrders}>
          список заказов
        </Link>
        .
      </Alert>
    )
  }

  const detail = order.data
  const canCancel = BUYER_CANCELABLE.includes(detail.status)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-xl font-semibold text-text">Заказ от {formatDate(detail.createdAt)}</h1>
        <Badge variant={detail.status === 'cancelled' ? 'danger' : 'secondary'}>
          {ORDER_STATUS_LABELS[detail.status]}
        </Badge>
      </div>

      <ul className="flex flex-col gap-2">
        {detail.items.map((item) => (
          <li
            key={item.id}
            className="flex flex-wrap items-center justify-between gap-2 rounded-card border border-border p-3 text-sm"
          >
            <span className="text-text">
              {item.titleSnapshot}
              <span className="text-text-muted"> × {item.quantity}</span>
            </span>
            <span className="text-text">{formatPrice(item.priceKopecks * item.quantity)}</span>
          </li>
        ))}
      </ul>

      <div className="flex flex-wrap items-center justify-between gap-2 rounded-card border border-border p-4">
        <span className="font-medium text-text">Итого: {formatPrice(detail.totalKopecks)}</span>
        {canCancel && (
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Причина отмены — необязательно"
              aria-label="Причина отмены"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              className="min-h-11 rounded-md border border-border px-3 text-sm"
            />
            <Button
              type="button"
              variant="danger"
              disabled={cancel.isPending}
              onClick={() => cancel.mutate({ id: detail.id, reason: reason.trim() || undefined })}
            >
              {cancel.isPending ? 'Отменяем…' : 'Отменить заказ'}
            </Button>
          </div>
        )}
      </div>

      {cancel.isError && (
        <Alert variant="danger" title="Не удалось отменить заказ">
          {cancel.error instanceof ApiError ? cancel.error.message : 'Попробуйте ещё раз.'}
        </Alert>
      )}
    </div>
  )
}
