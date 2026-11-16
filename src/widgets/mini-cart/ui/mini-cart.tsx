import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

import { useCart } from '@/entities/cart/model/use-cart'
import { routes } from '@/shared/config/routes'
import { formatPrice } from '@/shared/lib/format'
import { Button } from '@/shared/ui/button/button'

// Мини-корзина в шапке：dropdown без перехода на страницу.
export function MiniCart() {
  const cart = useCart()
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const items = cart.data?.items ?? []
  const count = items.reduce((sum, item) => sum + item.quantity, 0)
  const total = items.reduce((sum, item) => sum + item.product.priceKopecks * item.quantity, 0)

  // Закрытие по клику вне и по Escape — dropdown не должен залипать.
  useEffect(() => {
    if (!open) return

    const onPointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false)
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    window.addEventListener('mousedown', onPointerDown)
    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.removeEventListener('mousedown', onPointerDown)
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  return (
    <div ref={containerRef} className="relative">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        aria-expanded={open}
        aria-haspopup="true"
        onClick={() => setOpen((value) => !value)}
      >
        Корзина{count > 0 ? ` (${count})` : ''}
      </Button>

      {open && (
        <div
          role="dialog"
          aria-label="Мини-корзина"
          className="absolute right-0 top-full z-30 mt-1 w-72 rounded-card border border-border bg-surface p-3 shadow-lg"
        >
          {items.length === 0 ? (
            <p className="text-sm text-text-muted">Корзина пуста</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {items.map((item) => (
                <li key={item.id} className="flex justify-between gap-2 text-sm">
                  <span className="text-text">
                    {item.product.title}
                    <span className="text-text-muted"> × {item.quantity}</span>
                  </span>
                  <span className="text-text">
                    {formatPrice(item.product.priceKopecks * item.quantity)}
                  </span>
                </li>
              ))}
            </ul>
          )}

          {items.length > 0 && (
            <div className="mt-3 flex items-center justify-between border-t border-border pt-2">
              <span className="text-sm font-medium text-text">Итого: {formatPrice(total)}</span>
              <Button asChild size="sm">
                <Link to={routes.cart}>Открыть корзину</Link>
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
