import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'

import { ApiError } from '@/shared/api/errors'
import type { Order } from '@/shared/api/orders-api'
import { ORDER_STATUS_LABELS } from '@/shared/api/orders-api'
import { sellerApi } from '@/shared/api/seller-api'
import { formatDate, formatPrice } from '@/shared/lib/format'
import { Alert } from '@/shared/ui/alert/alert'
import { Badge } from '@/shared/ui/badge/badge'
import { Button } from '@/shared/ui/button/button'
import { Skeleton } from '@/shared/ui/skeleton/skeleton'

// Заказы продавца:фильтр по статусу,переходы,трек-номер,отмена с причиной.
const STATUSES = [
  'created',
  'confirmed',
  'assembling',
  'shipped',
  'delivered',
  'cancelled',
] as const

// Допустимые следующие статусы — зеркалят transitions на бэкенде.
const NEXT_STATUS: Record<string, string[]> = {
  created: ['confirmed', 'cancelled'],
  confirmed: ['assembling', 'cancelled'],
  assembling: ['shipped', 'cancelled'],
}

export default function SellerOrdersPage() {
  const [status, setStatus] = useState<string>('')
  const queryClient = useQueryClient()

  const orders = useQuery({
    queryKey: ['seller-orders', status],
    queryFn: () => sellerApi.orders({ status: status || undefined }),
  })

  const changeStatus = useMutation({
    mutationFn: ({
      orderId,
      next,
      trackingNumber,
    }: {
      orderId: string
      next: string
      trackingNumber?: string
    }) =>
      next === 'cancelled'
        ? sellerApi.cancelOrder(orderId, 'Отменён продавцом')
        : sellerApi.updateOrderStatus(orderId, next, trackingNumber),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['seller-orders'] })
    },
  })

  const items = orders.data?.items ?? []

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="text-xl font-semibold text-text">Заказы</h1>
        <label className="flex items-center gap-2 text-sm text-text">
          Статус:
          <select
            className="min-h-11 rounded-md border border-border bg-surface px-2 text-sm"
            value={status}
            onChange={(event) => setStatus(event.target.value)}
          >
            <option value="">Все</option>
            {STATUSES.map((value) => (
              <option key={value} value={value}>
                {ORDER_STATUS_LABELS[value]}
              </option>
            ))}
          </select>
        </label>
      </div>

      {orders.isPending && <Skeleton className="h-24 w-full" />}

      {changeStatus.isError && (
        <Alert variant="danger" title="Не удалось изменить статус">
          {changeStatus.error instanceof ApiError
            ? changeStatus.error.message
            : 'Попробуйте ещё раз.'}
        </Alert>
      )}

      {!orders.isPending && items.length === 0 && (
        <p className="text-sm text-text-muted">Заказов с таким статусом пока нет.</p>
      )}

      <ul className="flex flex-col gap-3">
        {items.map((order) => (
          <SellerOrderRow
            key={order.id}
            order={order}
            pending={changeStatus.isPending}
            onChange={(next, trackingNumber) =>
              changeStatus.mutate({ orderId: order.id, next, trackingNumber })
            }
          />
        ))}
      </ul>
    </div>
  )
}

interface SellerOrderRowProps {
  order: Order
  pending: boolean
  onChange: (next: string, trackingNumber?: string) => void
}

function SellerOrderRow({ order, pending, onChange }: SellerOrderRowProps) {
  const [tracking, setTracking] = useState('')
  const nextStatuses = NEXT_STATUS[order.status] ?? []

  return (
    <li className="flex flex-col gap-3 rounded-card border border-border p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm text-text-muted">{formatDate(order.createdAt)}</span>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-text">{formatPrice(order.totalKopecks)}</span>
          <Badge variant={order.status === 'cancelled' ? 'danger' : 'secondary'}>
            {ORDER_STATUS_LABELS[order.status]}
          </Badge>
        </div>
      </div>

      {/* Трек-номер — только для перехода в «отправлен» */}
      {nextStatuses.includes('shipped') && (
        <label className="flex items-center gap-2 text-sm text-text">
          Трек-номер:
          <input
            className="min-h-11 rounded-md border border-border px-2 text-sm"
            value={tracking}
            onChange={(event) => setTracking(event.target.value)}
          />
        </label>
      )}

      <div className="flex flex-wrap gap-2">
        {nextStatuses.map((next) => (
          <Button
            key={next}
            type="button"
            size="sm"
            variant={next === 'cancelled' ? 'danger' : 'outline'}
            disabled={pending}
            onClick={() => onChange(next, next === 'shipped' ? tracking.trim() : undefined)}
          >
            {ORDER_STATUS_LABELS[next as keyof typeof ORDER_STATUS_LABELS]}
          </Button>
        ))}
      </div>
    </li>
  )
}
