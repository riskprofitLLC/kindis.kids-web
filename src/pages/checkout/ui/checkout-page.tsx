import { useState } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'

import { useCart } from '@/entities/cart/model/use-cart'
import { useSessionStore } from '@/entities/session/model/session-store'
import { useCheckout } from '@/features/checkout/model/use-checkout'
import { AddressForm, type AddressValues } from '@/features/checkout/ui/address-form'
import { ApiError } from '@/shared/api/errors'
import type { Order } from '@/shared/api/orders-api'
import { routes } from '@/shared/config/routes'
import {
  calculateTotals,
  DELIVERY_LABELS,
  DELIVERY_METHODS,
  deliveryCost,
  type DeliveryMethod,
  findStockConflicts,
} from '@/shared/domain/cart'
import { cn } from '@/shared/lib/cn'
import { formatPrice } from '@/shared/lib/format'
import { Alert } from '@/shared/ui/alert/alert'
import { Button } from '@/shared/ui/button/button'

type Step = 1 | 2 | 3

// Оформление заказа:состав → адрес → подтверждение. Без входа не работает —
// заказ создаётся на сервере из пользовательской корзины.
export default function CheckoutPage() {
  const location = useLocation()
  const status = useSessionStore((state) => state.status)
  const cart = useCart()
  const checkout = useCheckout()

  const [step, setStep] = useState<Step>(1)
  const [method, setMethod] = useState<DeliveryMethod>('pickup')
  const [address, setAddress] = useState<AddressValues | null>(null)
  const [comment, setComment] = useState('')
  const [placedOrder, setPlacedOrder] = useState<Order | null>(null)

  if (status === 'anonymous') {
    return <Navigate to={routes.login} state={{ from: location.pathname }} replace />
  }

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
  const delivery = deliveryCost(method)

  const submitOrder = () => {
    checkout.mutate(
      {
        deliveryMethod: method,
        address: method === 'post' && address ? { ...address } : undefined,
        comment: comment.trim() || undefined,
      },
      {
        onSuccess: (order) => setPlacedOrder(order),
        onError: () => setPlacedOrder(null),
      },
    )
  }

  // Финальный экран:номер заказа и что дальше.
  if (placedOrder) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10">
        <div className="rounded-card border border-border p-6">
          <h1 className="text-xl font-semibold text-text">Заказ оформлен</h1>
          <p className="mt-2 text-sm text-text-muted">
            Номер заказа:
            <span className="font-medium text-text">{placedOrder.id}</span>
          </p>
          <p className="mt-1 text-sm text-text-muted">
            Сумма товаров: {formatPrice(placedOrder.totalKopecks)}. Доставка согласуется с продавцом
            отдельно. Следите за статусом в личном кабинете.
          </p>
          <div className="mt-4 flex gap-2">
            <Button asChild>
              <Link to={routes.cabinet}>Мои заказы</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to={routes.home}>На главную</Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10">
        <Alert variant="danger" title="Корзина пуста">
          Добавьте товары из{' '}
          <Link className="text-primary hover:underline" to={routes.catalog}>
            каталога
          </Link>
          .
        </Alert>
      </div>
    )
  }

  const steps = ['Состав', 'Адрес и доставка', 'Подтверждение']

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <h1 className="mb-4 text-xl font-semibold text-text">Оформление заказа</h1>

      {/* Индикатор шагов */}
      <ol className="mb-6 flex gap-2 text-sm">
        {steps.map((title, index) => {
          const number = index + 1
          return (
            <li
              key={title}
              aria-current={step === number ? 'step' : undefined}
              className={cn(
                'flex-1 rounded-md border px-3 py-2 text-center',
                step === number
                  ? 'border-primary font-medium text-primary'
                  : 'border-border text-text-muted',
              )}
            >
              {number}. {title}
            </li>
          )
        })}
      </ol>

      {conflicts.length > 0 && (
        <Alert variant="danger" title="Сначала устраните конфликты остатка">
          Вернитесь в корзину и поправьте количества.
        </Alert>
      )}

      {/* Шаг 1:состав */}
      {step === 1 && (
        <section className="flex flex-col gap-3">
          <ul className="flex flex-col gap-2">
            {items.map((item) => (
              <li
                key={item.id}
                className="flex justify-between gap-2 border-b border-border pb-2 text-sm"
              >
                <span className="text-text">
                  {item.title}
                  <span className="text-text-muted"> × {item.quantity}</span>
                </span>
                <span className="text-text">{formatPrice(item.priceKopecks * item.quantity)}</span>
              </li>
            ))}
          </ul>
          <p className="text-sm text-text">
            Товары: <span className="font-medium">{formatPrice(totals.totalKopecks)}</span>
          </p>
          <div className="flex justify-end">
            <Button type="button" onClick={() => setStep(2)} disabled={conflicts.length > 0}>
              Далее:доставка
            </Button>
          </div>
        </section>
      )}

      {/* Шаг 2:доставка и адрес */}
      {step === 2 && (
        <section className="flex flex-col gap-4">
          <fieldset className="flex flex-col gap-2">
            <legend className="text-sm font-medium text-text">Способ доставки</legend>
            {DELIVERY_METHODS.map((value) => (
              <label
                key={value}
                className={cn(
                  'flex min-h-11 items-center gap-2 rounded-md border px-3 text-sm',
                  method === value ? 'border-primary text-text' : 'border-border text-text-muted',
                )}
              >
                <input
                  type="radio"
                  name="delivery"
                  className="h-4 w-4"
                  checked={method === value}
                  onChange={() => setMethod(value)}
                />
                <span className="flex-1">{DELIVERY_LABELS[value]}</span>
                <span className="text-xs text-text-muted">
                  {deliveryCost(value) === 0 ? 'бесплатно' : formatPrice(deliveryCost(value))}
                </span>
              </label>
            ))}
          </fieldset>

          <AddressForm
            method={method}
            onSubmit={(values) => {
              setAddress(values)
              setStep(3)
            }}
          />

          <div className="flex justify-between">
            <Button type="button" variant="ghost" onClick={() => setStep(1)}>
              Назад
            </Button>
            {method !== 'post' && (
              <Button type="button" onClick={() => setStep(3)}>
                Далее:подтверждение
              </Button>
            )}
          </div>
        </section>
      )}

      {/* Шаг 3:подтверждение */}
      {step === 3 && (
        <section className="flex flex-col gap-4">
          <dl className="flex flex-col gap-1 text-sm">
            <div className="flex justify-between">
              <dt className="text-text-muted">Товары</dt>
              <dd className="text-text">{formatPrice(totals.totalKopecks)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-text-muted">Доставка: {DELIVERY_LABELS[method]}</dt>
              <dd className="text-text">{delivery === 0 ? 'бесплатно' : formatPrice(delivery)}</dd>
            </div>
            <div className="flex justify-between border-t border-border pt-1">
              <dt className="font-medium text-text">Итого</dt>
              <dd className="font-medium text-text">
                {formatPrice(totals.totalKopecks + delivery)}
              </dd>
            </div>
          </dl>

          {/* Комментарий к заказу */}
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-text">Комментарий к заказу</span>
            <textarea
              rows={3}
              maxLength={1000}
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              placeholder="Пожелания по доставке,времени связи — необязательно"
              className="rounded-md border border-border px-3 py-2 text-sm"
            />
          </label>

          {checkout.isError && (
            <Alert variant="danger" title="Не удалось оформить заказ">
              {checkout.error instanceof ApiError ? checkout.error.message : 'Попробуйте ещё раз.'}
            </Alert>
          )}

          <div className="flex justify-between">
            <Button type="button" variant="ghost" onClick={() => setStep(2)}>
              Назад
            </Button>
            {/* Защита от двойного клика:кнопка заблокирована на время запроса,
                а ключ идемпотентности не даст создать второй заказ. */}
            <Button
              type="button"
              disabled={checkout.isPending || conflicts.length > 0}
              onClick={submitOrder}
            >
              {checkout.isPending ? 'Оформляем…' : 'Подтвердить заказ'}
            </Button>
          </div>
        </section>
      )}
    </div>
  )
}
