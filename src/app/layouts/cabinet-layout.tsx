import { NavLink, Outlet } from 'react-router-dom'

import { useSessionStore } from '@/entities/session/model/session-store'
import { routes } from '@/shared/config/routes'
import type { UserRole } from '@/shared/domain/user'
import { cn } from '@/shared/lib/cn'
import { usePageMeta } from '@/shared/lib/use-page-meta'
import { Header } from '@/widgets/header/ui/header'
import { OfflineBanner } from '@/widgets/offline-banner/ui/offline-banner'

interface NavItem {
  to: string
  label: string
}

interface NavGroup {
  title?: string
  items: NavItem[]
}

const buyerItems: NavItem[] = [
  { to: routes.cabinet, label: 'Обзор' },
  { to: routes.cabinetOrders, label: 'Заказы' },
  { to: routes.cabinetFavorites, label: 'Избранное' },
  { to: routes.cabinetProfile, label: 'Профиль' },
]

// Продавец — не отдельная роль: это родитель с профилем ребёнка.
const sellerItems: NavItem[] = [
  { to: routes.cabinetChildProfile, label: 'Профиль ребёнка' },
  { to: routes.cabinetProducts, label: 'Мои товары' },
  { to: routes.cabinetSellerOrders, label: 'Заказы продавца' },
  { to: routes.cabinetAnalytics, label: 'Аналитика' },
  { to: routes.cabinetChats, label: 'Чаты' },
]

const adminItems: NavItem[] = [
  { to: routes.adminModeration, label: 'Модерация' },
  { to: routes.adminCategories, label: 'Категории' },
  { to: routes.adminAttributes, label: 'Атрибуты' },
  { to: routes.adminAudit, label: 'Аудит' },
]

// Пункты кабинета зависят от роли сессии; маршруты берём из единого реестра.
export function getCabinetNav(role: UserRole | null): NavGroup[] {
  if (role === 'admin') {
    return [{ title: 'Администрирование', items: adminItems }]
  }
  if (role === 'parent') {
    return [{ items: [...buyerItems, ...sellerItems] }]
  }
  return [{ items: buyerItems }]
}

// Ссылка кабинета с активным состоянием роутера.
function CabinetNavLink({ item }: { item: NavItem }) {
  return (
    <NavLink
      to={item.to}
      end={item.to === routes.cabinet}
      className={({ isActive }) =>
        cn(
          'rounded-md px-3 py-2 text-sm text-text hover:text-primary focus-visible:-outline-offset-2 focus-visible:outline-2 focus-visible:outline-primary',
          isActive && 'font-medium text-primary',
        )
      }
    >
      {item.label}
    </NavLink>
  )
}

// Кабинетный layout: сайдбар на десктопе, горизонтальная лента на мобильном.
export function CabinetLayout() {
  // Личный кабинет в поиске не нужен — закрываем страницу от индексации.
  usePageMeta({ noindex: true })

  const role = useSessionStore((state) => state.user?.role ?? null)
  const groups = getCabinetNav(role)

  return (
    <div className="min-h-dvh bg-surface">
      <OfflineBanner />
      <Header />
      <div className="mx-auto w-full max-w-6xl p-4">
        {/* Мобильная лента вместо сайдбара — узкий экран не ломаем колонкой */}
        <nav
          aria-label="Навигация кабинета мобильная"
          className="-mx-4 mb-4 flex gap-2 overflow-x-auto border-b border-border px-4 pb-2 md:hidden"
        >
          {groups.map((group) => (
            <div
              key={group.title ?? group.items[0].to}
              className="flex shrink-0 items-center gap-2"
            >
              {group.title && (
                <span className="px-1 text-xs font-semibold tracking-wide text-text-muted uppercase">
                  {group.title}
                </span>
              )}
              {group.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === routes.cabinet}
                  className={({ isActive }) =>
                    cn(
                      'whitespace-nowrap rounded-full border border-border px-3 py-1.5 text-sm text-text hover:text-primary focus-visible:-outline-offset-2 focus-visible:outline-2 focus-visible:outline-primary',
                      isActive && 'border-primary font-medium text-primary',
                    )
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>
        <div className="flex gap-6">
          <aside className="hidden w-56 shrink-0 md:block">
            <nav aria-label="Навигация кабинета" className="flex flex-col gap-3">
              {groups.map((group) => (
                <div key={group.title ?? group.items[0].to} className="flex flex-col gap-1">
                  {group.title && (
                    <p className="px-3 pt-2 text-xs font-semibold tracking-wide text-text-muted uppercase">
                      {group.title}
                    </p>
                  )}
                  {group.items.map((item) => (
                    <CabinetNavLink key={item.to} item={item} />
                  ))}
                </div>
              ))}
            </nav>
          </aside>

          <main className="min-w-0 flex-1">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  )
}
