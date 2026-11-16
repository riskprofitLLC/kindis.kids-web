import { Link } from 'react-router-dom'

import { routes } from '@/shared/config/routes'

export default function NotFoundPage() {
  return (
    <section className="mx-auto max-w-md p-8 text-center">
      <h1 className="text-xl font-semibold text-text">Страница не найдена</h1>
      <p className="mt-2 text-text-muted">Проверьте адрес или вернитесь на главную.</p>
      <Link
        to={routes.home}
        className="mt-4 inline-flex min-h-11 items-center rounded-md bg-primary px-4 text-primary-foreground"
      >
        На главную
      </Link>
    </section>
  )
}
