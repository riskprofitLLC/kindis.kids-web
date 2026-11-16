import { CartView } from '@/features/cart/ui/cart-view'

// Страница корзины：состав，количество，итог，переход к оформлению.
export default function CartPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <h1 className="mb-4 text-xl font-semibold text-text">Корзина</h1>
      <CartView />
    </div>
  )
}
