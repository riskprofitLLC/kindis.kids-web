import type { ProductCard } from '@/shared/api/catalog-api'
import { formatPrice } from '@/shared/lib/format'

// Попап строим через DOM:город и названия поделок — пользовательский ввод,
// поэтому setHTML с подстановкой был XSS.
export function buildPopupContent(city: string, items: ProductCard[]): HTMLElement {
  const root = document.createElement('div')
  root.className = 'flex flex-col gap-0.5 text-sm'

  const title = document.createElement('strong')
  title.textContent = city
  root.append(title)

  const count = document.createElement('span')
  count.textContent = `Поделок: ${items.length}`
  root.append(count)

  for (const item of items.slice(0, 3)) {
    const line = document.createElement('span')
    line.textContent = `${item.title} — ${formatPrice(item.priceKopecks)}`
    root.append(line)
  }

  return root
}