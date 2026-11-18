import { useEffect, useRef, useState } from 'react'
import { Link, NavLink } from 'react-router-dom'

import { SearchSuggestions } from '@/features/search/ui/search-suggestions'
import { routes } from '@/shared/config/routes'
import { cn } from '@/shared/lib/cn'
import { MiniCart } from '@/widgets/mini-cart/ui/mini-cart'
import { UserMenu } from '@/widgets/user-menu/ui/user-menu'

// Единственная ссылка основной навигации — «Каталог»; поиск идёт через строку с кнопкой «Найти».
const navItems = [{ to: routes.catalog, label: 'Каталог' }]

// Ссылка на избранное в utilities-баре — иконка сердца.
function FavoritesLink() {
  return (
    <Link
      to={routes.cabinetFavorites}
      aria-label="Избранное"
      className="inline-flex h-11 w-11 items-center justify-center rounded-control text-text-muted transition-colors hover:bg-surface-muted hover:text-primary focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-primary"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        aria-hidden="true"
        className="h-[18px] w-[18px]"
      >
        <path
          d="M12 20s-7-4.35-7-9.5A4.5 4.5 0 0 1 12 7a4.5 4.5 0 0 1 7 3.5C19 15.65 12 20 12 20z"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </Link>
  )
}

// Ссылка utilities-бара: мелкий серый текст, синий при наведении.
function UtilityLink({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <Link
      to={to}
      className="font-medium text-text-muted transition-colors hover:text-primary focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-primary"
    >
      {children}
    </Link>
  )
}

// Пункт мобильного меню — крупная зона нажатия для тача.
function MobileNavLink({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          'flex min-h-[44px] items-center rounded-control px-3 text-sm font-medium text-text transition-colors hover:text-primary focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-primary',
          isActive && 'text-primary',
        )
      }
    >
      {children}
    </NavLink>
  )
}

// Шапка в визуальном языке Avito:тонкий utilities-бар + строка с крупным поиском.
export function Header() {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Закрытие бургер-меню по Escape и клику вне панели.
  useEffect(() => {
    if (!menuOpen) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false)
    }
    const onPointerDown = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setMenuOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('mousedown', onPointerDown)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('mousedown', onPointerDown)
    }
  }, [menuOpen])

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-surface">
      {/* Utilities-бар:служебные ссылки и действия справа */}
      <div className="border-b border-border bg-surface-muted">
        <div className="mx-auto flex max-w-[1600px] items-center gap-4 px-4 py-1 text-xs">
          {/* Текстовые ссылки прячем на телефоне — остаются в бургер-меню */}
          <nav aria-label="Служебная навигация" className="hidden items-center gap-4 sm:flex">
            <UtilityLink to={routes.forBusiness}>Для бизнеса</UtilityLink>
            <UtilityLink to={routes.help}>Помощь</UtilityLink>
            <UtilityLink to={routes.about}>О проекте</UtilityLink>
          </nav>
          <div className="ml-auto flex items-center gap-1 sm:gap-3">
            <FavoritesLink />
            <MiniCart />
            {/* Войти / кабинет — сохраняем прежнее поведение UserMenu */}
            <span className="[&_a]:text-xs [&_button]:text-xs">
              <UserMenu />
            </span>
            {/* «Разместить» — только когда хватает места */}
            <Link
              to={routes.cabinetProductNew}
              className="hidden rounded-control bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary-hover focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-primary sm:inline-flex"
            >
              Разместить
            </Link>
          </div>
        </div>
      </div>

      {/* Главная строка:бургер + словомарка + крупный поиск с кнопкой «Найти» */}
      <div
        ref={menuRef}
        className="mx-auto flex max-w-[1600px] items-center gap-2 px-4 py-3 md:gap-4"
      >
        {/* Бургер только на мобильном — раскрывает панель навигации */}
        <button
          type="button"
          aria-label={menuOpen ? 'Закрыть меню' : 'Открыть меню'}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
          className="-ml-2 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-control text-text transition-colors hover:bg-surface-muted focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-primary md:hidden"
        >
          {menuOpen ? (
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
              className="h-6 w-6"
            >
              <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
            </svg>
          ) : (
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
              className="h-6 w-6"
            >
              <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
            </svg>
          )}
        </button>

        <Link
          to={routes.home}
          className="flex min-h-11 shrink-0 items-center gap-0.5 text-lg font-extrabold tracking-tight text-text md:text-xl"
        >
          kindis
          {/* Акцентная точка — handmade-accent словомарки */}
          <span
            aria-hidden="true"
            className="mb-1 inline-block h-[6px] w-[6px] rounded-full bg-primary transition-transform duration-200 group-hover:scale-125"
          />
          <span className="text-primary">kids</span>
        </Link>

        {/* Поиск занимает всю свободную ширину — он главный элемент строки */}
        <SearchSuggestions
          placeholder="Поиск поделок"
          submitLabel="Найти"
          className="min-w-0 flex-1"
        />

        <nav aria-label="Основная навигация" className="hidden shrink-0 items-center gap-1 md:flex">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  'rounded-control px-3 py-2 text-sm font-medium text-text transition-colors hover:text-primary focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-primary',
                  isActive && 'text-primary',
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Мобильная панель навигации — дублирует скрытые ссылки utilities и каталог */}
      {menuOpen && (
        <div className="md:hidden border-t border-border bg-surface px-4 py-3 shadow-lift">
          <nav aria-label="Мобильная навигация" className="flex flex-col gap-1">
            {navItems.map((item) => (
              <MobileNavLink key={item.to} to={item.to}>
                {item.label}
              </MobileNavLink>
            ))}
            <Link
              to={routes.forBusiness}
              className="flex min-h-[44px] items-center rounded-control px-3 text-sm font-medium text-text-muted transition-colors hover:text-primary focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              Для бизнеса
            </Link>
            <Link
              to={routes.help}
              className="flex min-h-[44px] items-center rounded-control px-3 text-sm font-medium text-text-muted transition-colors hover:text-primary focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              Помощь
            </Link>
            <Link
              to={routes.about}
              className="flex min-h-[44px] items-center rounded-control px-3 text-sm font-medium text-text-muted transition-colors hover:text-primary focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              О проекте
            </Link>
          </nav>
        </div>
      )}
    </header>
  )
}
