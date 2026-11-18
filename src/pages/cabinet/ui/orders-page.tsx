import { Link } from 'react-router-dom'

import { useMyOrders } from '@/features/orders/model/use-orders'
import { ORDER_STATUS_LABELS } from '@/shared/api/orders-api'
import { routes } from '@/shared/config/routes'
import { formatDate, formatPrice } from '@/shared/lib/format'
import { Alert } from '@/shared/ui/alert/alert'
import { Badge } from '@/shared/ui/badge/badge'
import { Button } from '@/shared/ui/button/button'
import { EmptyState } from '@/shared/ui/empty-state/empty-state'
import { Skeleton } from '@/shared/ui/skeleton/skeleton'
import { LoadingRegion } from '@/shared/ui/skeleton/skeleton-loading-region'

// Заказы покупателя:список со статусами и составом.
export default function OrdersPage() {
  const orders = useMyOrders()

  if (orders.isPending) {
    return (
      <ul className="flex flex-col gap-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <li key={`skeleton-${index}`}>
            <LoadingRegion>
              <Skeleton className="h-16 w-full" />
            </LoadingRegion>
          </li>
        ))}
      </ul>
    )
  }

  if (orders.isError) {
    return (
      <Alert variant="danger" title="Не удалось загрузить заказы">
        Проверьте соединение и попробуйте снова.
      </Alert>
    )
  }

  const items = orders.data ?? []

  if (items.length === 0) {
    return (
      <EmptyState
        kind="box"
        title="Заказов пока нет"
        description="Выберите поделку в каталоге — и она появится здесь."
        action={
          <Button asChild>
            <Link to={routes.catalog}>Открыть каталог</Link>
          </Button>
        }
      />
    )
  }

  return (
    <ul className="flex flex-col gap-3">
      {items.map((order) => (
        <li
          key={order.id}
          className="flex flex-wrap items-center justify-between gap-3 rounded-card border border-border p-4"
        >
          <div>
            <p className="text-sm text-text-muted">от {formatDate(order.createdAt)}</p>
            <p className="text-sm font-medium text-text">{formatPrice(order.totalKopecks)}</p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant={order.status === 'cancelled' ? 'danger' : 'secondary'}>
              {ORDER_STATUS_LABELS[order.status]}
            </Badge>
            <Link
              className="min-h-11 rounded-md border border-border px-3 py-2 text-sm text-text hover:bg-surface-muted"
              to={routes.cabinetOrderDetail(order.id)}
            >
              Детали
            </Link>
          </div>
        </li>
      ))}
    </ul>
  )
}
