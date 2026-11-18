import { useQuery } from '@tanstack/react-query'

import { sellerApi } from '@/shared/api/seller-api'
import { formatPrice } from '@/shared/lib/format'
import { Alert } from '@/shared/ui/alert/alert'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card/card'
import { Skeleton } from '@/shared/ui/skeleton/skeleton'

// Аналитика витрины:просмотры и продажи по дням из /seller/stats.
export default function AnalyticsPage() {
  const stats = useQuery({
    queryKey: ['seller-stats'],
    queryFn: () => sellerApi.stats(),
  })

  if (stats.isPending) {
    return <Skeleton className="h-48 w-full" />
  }

  if (stats.isError || !stats.data) {
    return (
      <Alert variant="danger" title="Не удалось загрузить статистику">
        Попробуйте обновить страницу позже.
      </Alert>
    )
  }

  const { days, totals } = stats.data
  const maxViews = Math.max(...days.map((day) => day.views), 1)
  const maxSales = Math.max(...days.map((day) => day.salesKopecks), 1)

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold text-text">Аналитика витрины</h1>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-text-muted">Просмотры</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-text">{totals.views}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-text-muted">Продажи</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-text">{formatPrice(totals.salesKopecks)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-text-muted">Заказов</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-text">{totals.ordersCount}</p>
          </CardContent>
        </Card>
      </div>

      {/* Столбцы просмотров по дням — простой SVG,без графических библиотей */}
      <Card>
        <CardHeader>
          <CardTitle>Просмотры по дням</CardTitle>
        </CardHeader>
        <CardContent>
          {days.length === 0 ? (
            <p className="text-sm text-text-muted">Данных за период пока нет.</p>
          ) : (
            <div
              className="flex h-40 items-end gap-1"
              role="img"
              aria-label="График просмотров по дням"
            >
              {days.map((day) => (
                <div
                  key={day.day}
                  className="flex-1 rounded-t bg-primary"
                  style={{ height: `${Math.round((day.views / maxViews) * 100)}%` }}
                  title={`${day.day}: ${day.views}`}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Продажи по дням — второй график */}
      <Card>
        <CardHeader>
          <CardTitle>Продажи по дням</CardTitle>
        </CardHeader>
        <CardContent>
          {days.length === 0 ? (
            <p className="text-sm text-text-muted">Данных за период пока нет.</p>
          ) : (
            <div
              className="flex h-40 items-end gap-1"
              role="img"
              aria-label="График продаж по дням"
            >
              {days.map((day) => (
                <div
                  key={day.day}
                  className="flex-1 rounded-t bg-success"
                  style={{ height: `${Math.round((day.salesKopecks / maxSales) * 100)}%` }}
                  title={`${day.day}: ${formatPrice(day.salesKopecks)}`}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
