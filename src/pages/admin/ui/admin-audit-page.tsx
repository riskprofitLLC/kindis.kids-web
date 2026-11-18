import { useQuery } from '@tanstack/react-query'

import { adminApi } from '@/shared/api/admin-api'
import { formatDate } from '@/shared/lib/format'
import { Alert } from '@/shared/ui/alert/alert'
import { Skeleton } from '@/shared/ui/skeleton/skeleton'
import { LoadingRegion } from '@/shared/ui/skeleton/skeleton-loading-region'

// Журнал обращений к специальным данным — только для админа.
export default function AdminAuditPage() {
  const audit = useQuery({
    queryKey: ['admin-audit'],
    queryFn: () => adminApi.audit({ limit: 200 }),
  })

  if (audit.isPending) {
    return (
      <LoadingRegion>
        <Skeleton className="h-40 w-full" />
      </LoadingRegion>
    )
  }

  if (audit.isError) {
    return (
      <Alert variant="danger" title="Не удалось загрузить журнал">
        Попробуйте обновить страницу.
      </Alert>
    )
  }

  const rows = (audit.data ?? []) as Array<{
    id: string
    action: string
    entityType: string
    entityId: string
    createdAt: string
    actor?: { email?: string; fullName?: string | null } | null
  }>

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold text-text">Аудит спецданных</h1>

      {rows.length === 0 ? (
        <p className="text-sm text-text-muted">Обращений к спецданным пока не было.</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-text-muted">
              <th className="py-2">Когда</th>
              <th className="py-2">Кто</th>
              <th className="py-2">Действие</th>
              <th className="py-2">Объект</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-border text-text">
                <td className="py-2">{formatDate(row.createdAt)}</td>
                <td className="py-2">{row.actor?.fullName ?? row.actor?.email ?? '—'}</td>
                <td className="py-2">{row.action}</td>
                <td className="py-2">
                  {row.entityType}/{row.entityId.slice(0, 8)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
