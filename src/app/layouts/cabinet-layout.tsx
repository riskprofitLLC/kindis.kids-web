import { NavLink, Outlet } from 'react-router-dom'

import { routes } from '@/shared/config/routes'
import { cn } from '@/shared/lib/cn'
import { Header } from '@/widgets/header/ui/header'
import { OfflineBanner } from '@/widgets/offline-banner/ui/offline-banner'

const sidebarItems = [
  { to: routes.cabinet, label: 'Обзор' },
  { to: `${routes.cabinet}/orders`, label: 'Заказы' },
  { to: `${routes.cabinet}/favorites`, label: 'Избранное' },
  { to: `${routes.cabinet}/profile`, label: 'Профиль' },
  { to: `${routes.cabinet}/child-profile`, label: 'Профиль ребёнка' },
]

// Кабинетный layout: сайдбар (этап 0), наполнение — этапы 1–5
export function CabinetLayout() {
  return (
    <div className="min-h-dvh bg-surface">
      <OfflineBanner />
      <Header />
      <div className="mx-auto flex w-full max-w-6xl gap-6 p-4">
        <aside aria-label="Навигация кабинета" className="w-56 shrink-0">
          <nav className="flex flex-col gap-1">
            {sidebarItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === routes.cabinet}
                className={({ isActive }) =>
                  cn(
                    'rounded-md px-3 py-2 text-sm text-text hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-primary',
                    isActive && 'bg-surface-muted font-medium text-primary',
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </aside>
        <main className="flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
