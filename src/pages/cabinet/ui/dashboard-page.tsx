import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'

import { useMyOrders } from '@/features/orders/model/use-orders'
import { childrenApi } from '@/shared/api/children-api'
import { ORDER_STATUS_LABELS } from '@/shared/api/orders-api'
import { sellerApi } from '@/shared/api/seller-api'
import { routes } from '@/shared/config/routes'
import { formatDate, formatPrice } from '@/shared/lib/format'
import { Badge } from '@/shared/ui/badge/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card/card'
import { Skeleton } from '@/shared/ui/skeleton/skeleton'

// Рабочий стол：продавцу — сводка по его витрине，покупателю — быстрые ссылки.
export default function DashboardPage() {
  const profiles = useQuery({
    queryKey: ['my-children'],
    queryFn: () => childrenApi.mine(),
  })

  const isSeller = (profiles.data ?? []).length > 0

  if (profiles.isPending) {
    return <Skeleton className="h-32 w-full" />
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold text-text">Кабинет</h1>

      {isSeller ? <SellerSummary /> : <BuyerSummary />}
    </div>
  )
}

// Сводка продавца：новые заказы，товары на исходе，просмотры，выручка.
function SellerSummary() {
  const dashboard = useQuery({
    queryKey: ['seller-dashboard'],
    queryFn: () => sellerApi.dashboard(),
  })

  if (dashboard.isPending || !dashboard.data) {
    return <Skeleton className="h-24 w-full" />
  }

  const summary = dashboard.data

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard title="Новые заказы" value={String(summary.newOrders)} hint="ждут подтверждения" />
      <StatCard title="Просмотры профиля" value={String(summary.profileViews)} hint="за 30 дней" />
      <StatCard
        title="Выручка 30 дней"
        value={formatPrice(summary.revenue30DaysKopecks)}
        hint="по подтверждённым заказам"
      />
      <StatCard
        title="Товары на исходе"
        value={String(summary.lowStockProducts.length)}
        hint="остаток менее 3 шт."
      />
    </div>
  )
}

interface StatCardProps {
  title: string
  value: string
  hint?: string
}

function StatCard({ title, value, hint }: StatCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm text-text-muted">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-semibold text-text">{value}</p>
        {hint && <p className="text-xs text-text-muted">{hint}</p>}
      </CardContent>
    </Card>
  )
}

// Сводка покупателя：последние заказы и ссылки на разделы.
function BuyerSummary() {
  const orders = useMyOrders()
  const recent = (orders.data ?? []).slice(0, 3)

  return (
    <div className="flex flex-col gap-4">
      <ul className="flex flex-wrap gap-3 text-sm">
        <li>
          <Link className="text-primary hover:underline" to={routes.cabinetOrders}>
            Мои заказы
          </Link>
        </li>
        <li>
          <Link className="text-primary hover:underline" to={routes.cabinetFavorites}>
            Избранное
          </Link>
        </li>
        <li>
          <Link className="text-primary hover:underline" to={routes.cabinetProfile}>
            Настройки профиля
          </Link>
        </li>
      </ul>

      <div className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold text-text">Последние заказы</h2>
        {recent.length === 0 ? (
          <p className="text-sm text-text-muted">Заказов пока нет.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {recent.map((order) => (
              <li
                key={order.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-card border border-border p-3 text-sm"
              >
                <span className="text-text-muted">{formatDate(order.createdAt)}</span>
                <span className="text-text">{formatPrice(order.totalKopecks)}</span>
                <Badge variant={order.status === 'cancelled' ? 'danger' : 'secondary'}>
                  {ORDER_STATUS_LABELS[order.status]}
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
