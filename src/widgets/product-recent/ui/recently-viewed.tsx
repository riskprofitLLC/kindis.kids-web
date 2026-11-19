import { Link } from 'react-router-dom'

import { routes } from '@/shared/config/routes'
import { listRecent } from '@/shared/lib/recently-viewed'

// Блок «Недавно смотрели»: локальный список, без сети и без состояния сессии.
export function RecentlyViewed() {
  const items = listRecent()

  if (items.length === 0) return null

  return (
    <nav aria-label="Недавно смотрели" className="border-t border-border pt-4">
      <h2 className="text-sm font-semibold text-text-muted">Недавно смотрели</h2>
      <ul className="mt-2 flex flex-col">
        {items.map((item) => (
          <li key={item.id}>
            <Link
              to={routes.product(item.id)}
              className="flex min-h-11 items-center px-1 text-sm text-text hover:text-primary"
            >
              {item.title}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}