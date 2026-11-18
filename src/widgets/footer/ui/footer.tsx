import { Link } from 'react-router-dom'

import { routes } from '@/shared/config/routes'

export function Footer() {
  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto max-w-6xl px-4 py-6 text-sm text-text-muted">
        <nav aria-label="Подвал" className="flex gap-4">
          <Link
            to={routes.catalog}
            className="inline-flex min-h-[44px] items-center hover:text-text"
          >
            Каталог
          </Link>
          <Link
            to={routes.consent}
            className="inline-flex min-h-[44px] items-center hover:text-text"
          >
            Согласие на обработку данных
          </Link>
          <Link to={routes.help} className="inline-flex min-h-[44px] items-center hover:text-text">
            Помощь
          </Link>
          <Link to={routes.about} className="inline-flex min-h-[44px] items-center hover:text-text">
            О проекте
          </Link>
          <Link
            to={routes.forBusiness}
            className="inline-flex min-h-[44px] items-center hover:text-text"
          >
            Для бизнеса
          </Link>
        </nav>
        <p className="mt-4">© kindis.kids</p>
      </div>
    </footer>
  )
}
