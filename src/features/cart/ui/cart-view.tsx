import { useState } from 'react'
import { Link } from 'react-router-dom'

import {
  useCart,
  useClearCart,
  useRemoveCartItem,
  useUpdateCartItem,
} from '@/entities/cart/model/use-cart'
import { routes } from '@/shared/config/routes'
import { calculateTotals, findStockConflicts } from '@/shared/domain/cart'
import { formatPrice } from '@/shared/lib/format'
import { Alert } from '@/shared/ui/alert/alert'
import { Button } from '@/shared/ui/button/button'
import { EmptyState } from '@/shared/ui/empty-state/empty-state'
import { Skeleton } from '@/shared/ui/skeleton/skeleton'

// Корзина：состав，количество，удаление，очистка，итог и проверка остатков.
export function CartView() {
  const cart = useCart()
  const updateItem = useUpdateCartItem()
  const removeItem = useRemoveCartItem()
  const clearCart = useClearCart()
  const [confirmClear, setConfirmClear] = useState(false)

  const items = (cart.data?.items ?? []).map((item) => ({
    id: item.id,
    productId: item.productId,
    title: item.product.title,
    priceKopecks: item.product.priceKopecks,
    quantity: item.quantity,
    stock: item.product.stock,
  }))

  const totals = calculateTotals(items)
  const conflicts = findStockConflicts(items)

  if (cart.isPending) {
    return (
      <ul className="flex flex-col gap-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <li key={`skeleton-${index}`}>
            <Skeleton className="h-16 w-full" />
          </li>
        ))}
      </ul>
    )
  }

  if (cart.isError) {
    return (
      <Alert variant="danger" title="Не удалось загрузить корзину">
        Проверьте соединение и попробуйте снова.
      </Alert>
    )
  }

  if (items.length === 0) {
    return (
      <EmptyState
        kind="basket"
        title="Корзина пуста"
        description="Загляните в каталог — там поделки молодых мастеров."
        action={
          <Button asChild>
            <Link to={routes.catalog}>Открыть каталог</Link>
          </Button>
        }
      />
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Конфликты остатков — до оформления，а не на последнем шаге */}
      {conflicts.length > 0 && (
        <Alert variant="danger" title="Часть товаров недоступна в нужном количестве">
          <ul className="list-disc pl-5">
            {conflicts.map((conflict) => (
              <li key={conflict.productId}>
                «{conflict.title}»: в корзине {conflict.requested}, доступно {conflict.available}.
                Уменьшите количество или удалите позицию.
              </li>
            ))}
          </ul>
        </Alert>
      )}

      <ul className="flex flex-col gap-3">
        {items.map((item) => (
          <li
            key={item.id}
            className="flex flex-wrap items-center gap-3 rounded-card border border-border p-3"
          >
            <div className="flex-1">
              <Link
                className="text-sm font-medium text-text hover:text-primary"
                to={routes.product(item.productId)}
              >
                {item.title}
              </Link>
              <p className="text-xs text-text-muted">{formatPrice(item.priceKopecks)} за штуку</p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                aria-label={`Уменьшить количество: ${item.title}`}
                disabled={item.quantity <= 1 || updateItem.isPending}
                onClick={() => updateItem.mutate({ itemId: item.id, quantity: item.quantity - 1 })}
              >
                −
              </Button>
              <span aria-live="polite" className="min-w-8 text-center text-sm text-text">
                {item.quantity}
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                aria-label={`Увеличить количество: ${item.title}`}
                disabled={item.quantity >= item.stock || updateItem.isPending}
                onClick={() => updateItem.mutate({ itemId: item.id, quantity: item.quantity + 1 })}
              >
                +
              </Button>
            </div>

            <span className="w-24 text-right text-sm font-medium text-text">
              {formatPrice(item.priceKopecks * item.quantity)}
            </span>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={removeItem.isPending}
              onClick={() => removeItem.mutate(item.id)}
            >
              Удалить
            </Button>
          </li>
        ))}
      </ul>

      {/* Итог и действия */}
      <div className="flex flex-col gap-3 rounded-card border border-border p-4">
        <div className="flex justify-between text-sm text-text">
          <span>Товары ({totals.count})</span>
          <span>{formatPrice(totals.totalKopecks)}</span>
        </div>
        <p className="text-xs text-text-muted">
          Стоимость доставки считается на следующем шаге — она зависит от способа.
        </p>

        <div className="flex flex-wrap items-center gap-2">
          <Button asChild disabled={conflicts.length > 0}>
            <Link to={routes.checkout}>Оформить заказ</Link>
          </Button>

          {confirmClear ? (
            <span className="flex items-center gap-2 text-sm text-text-muted">
              Очистить корзину?
              <Button
                type="button"
                variant="danger"
                size="sm"
                disabled={clearCart.isPending}
                onClick={() => {
                  clearCart.mutate()
                  setConfirmClear(false)
                }}
              >
                Да，очистить
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setConfirmClear(false)}
              >
                Нет
              </Button>
            </span>
          ) : (
            <Button type="button" variant="ghost" size="sm" onClick={() => setConfirmClear(true)}>
              Очистить
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
