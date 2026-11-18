import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import { PRODUCT_STATUS_LABELS, productsApi, type ProductStatus } from '@/shared/api/products-api'
import { routes } from '@/shared/config/routes'
import { formatPrice } from '@/shared/lib/format'
import { Badge } from '@/shared/ui/badge/badge'
import { Button } from '@/shared/ui/button/button'
import { Skeleton } from '@/shared/ui/skeleton/skeleton'

// Товары продавца：фильтр по статусу，поиск，инлайн-правка цены и остатка.
const STATUSES: ProductStatus[] = ['draft', 'pending_review', 'active', 'archived']

export default function SellerProductsPage() {
  const queryClient = useQueryClient()
  const [status, setStatus] = useState<ProductStatus | ''>('')
  const [search, setSearch] = useState('')

  const products = useQuery({
    queryKey: ['seller-products'],
    queryFn: () => productsApi.mine(),
  })

  const invalidate = () => void queryClient.invalidateQueries({ queryKey: ['seller-products'] })

  // Быстрое редактирование цены и остатка инлайн.
  const quickEdit = useMutation({
    mutationFn: ({
      id,
      priceKopecks,
      stock,
    }: {
      id: string
      priceKopecks?: number
      stock?: number
    }) => productsApi.update(id, { priceKopecks, stock }),
    onSuccess: invalidate,
  })

  const statusAction = useMutation({
    mutationFn: ({
      id,
      action,
    }: {
      id: string
      action: 'submit' | 'archive' | 'restore' | 'remove'
    }) => {
      if (action === 'submit') return productsApi.submit(id)
      if (action === 'archive') return productsApi.archive(id)
      if (action === 'restore') return productsApi.restore(id)
      return productsApi.remove(id).then(() => undefined)
    },
    onSuccess: invalidate,
  })

  const items = useMemo(
    () =>
      (products.data ?? []).filter(
        (product) =>
          (!status || product.status === status) &&
          (!search.trim() || product.title.toLowerCase().includes(search.trim().toLowerCase())),
      ),
    [products.data, status, search],
  )

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-semibold text-text">Мои товары</h1>
        <Button asChild size="sm">
          <Link to={routes.cabinetProductNew}>Добавить товар</Link>
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        <label className="flex items-center gap-2 text-sm text-text">
          Статус:
          <select
            className="min-h-11 rounded-md border border-border bg-surface px-2 text-sm"
            value={status}
            onChange={(event) => setStatus(event.target.value as ProductStatus | '')}
          >
            <option value="">Все</option>
            {STATUSES.map((value) => (
              <option key={value} value={value}>
                {PRODUCT_STATUS_LABELS[value]}
              </option>
            ))}
          </select>
        </label>
        <input
          type="search"
          placeholder="Поиск по названию"
          aria-label="Поиск по названию"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="min-h-11 rounded-md border border-border px-3 text-sm"
        />
      </div>

      {products.isPending && <Skeleton className="h-24 w-full" />}

      {!products.isPending && items.length === 0 && (
        <p className="text-sm text-text-muted">Товаров не найдено.</p>
      )}

      <ul className="flex flex-col gap-3">
        {items.map((product) => (
          <li
            key={product.id}
            className="flex flex-col gap-3 rounded-card border border-border p-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Link
                className="text-sm font-medium text-text hover:text-primary"
                to={routes.cabinetProductEdit(product.id)}
              >
                {product.title}
              </Link>
              <Badge
                variant={
                  product.status === 'active'
                    ? 'success'
                    : product.status === 'archived'
                      ? 'secondary'
                      : 'default'
                }
              >
                {PRODUCT_STATUS_LABELS[product.status]}
              </Badge>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-sm">
              <span className="text-text">{formatPrice(product.priceKopecks)}</span>
              <label className="flex items-center gap-1 text-text-muted">
                Цена, ₽
                <input
                  type="number"
                  min={0}
                  defaultValue={Math.round(product.priceKopecks / 100)}
                  className="w-24 rounded-md border border-border px-2 py-1"
                  onBlur={(event) => {
                    const rub = Number(event.target.value)
                    if (Number.isFinite(rub) && rub > 0) {
                      quickEdit.mutate({
                        id: product.id,
                        priceKopecks: Math.round(rub * 100),
                      })
                    }
                  }}
                />
              </label>
              <label className="flex items-center gap-1 text-text-muted">
                Остаток
                <input
                  type="number"
                  min={0}
                  defaultValue={product.stock}
                  className="w-20 rounded-md border border-border px-2 py-1"
                  onBlur={(event) => {
                    const value = Number(event.target.value)
                    if (Number.isInteger(value) && value >= 0) {
                      quickEdit.mutate({ id: product.id, stock: value })
                    }
                  }}
                />
              </label>
            </div>

            <div className="flex flex-wrap gap-2">
              {product.status === 'draft' && (
                <Button
                  type="button"
                  size="sm"
                  disabled={statusAction.isPending}
                  onClick={() => statusAction.mutate({ id: product.id, action: 'submit' })}
                >
                  На модерацию
                </Button>
              )}
              {product.status === 'archived' ? (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={statusAction.isPending}
                  onClick={() => statusAction.mutate({ id: product.id, action: 'restore' })}
                >
                  Вернуть из архива
                </Button>
              ) : (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={statusAction.isPending}
                  onClick={() => statusAction.mutate({ id: product.id, action: 'archive' })}
                >
                  В архив
                </Button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
