import { Link } from 'react-router-dom'

import { routes } from '@/shared/config/routes'
import { Badge } from '@/shared/ui/badge/badge'

export default function ForBusinessPage() {
  return (
    <section className="mx-auto max-w-3xl space-y-6 p-8">
      <div className="space-y-2">
        <Badge variant="amber">Требует проверки</Badge>
        <h1 className="text-2xl font-semibold text-text">Для бизнеса</h1>
        <p className="text-text-muted">
          Страница для мастеров, небольших мастерских и брендов детских товаров.
        </p>
      </div>

      <div className="space-y-4 text-sm text-text-muted">
        <p>Условия размещения, комиссия и порядок выплат готовятся.</p>
        <p>Пока вы можете разместить первые изделия сами — это бесплатно и доступно сразу.</p>
      </div>

      <div className="flex flex-wrap gap-4 text-sm">
        <Link to={routes.register} className="text-primary hover:underline">
          Зарегистрироваться как продавец
        </Link>
        <Link to={routes.cabinetProductNew} className="text-primary hover:underline">
          Разместить изделие
        </Link>
      </div>

      <p className="text-sm text-text-muted">По условиям работы напишите нам через раздел «Помощь».</p>
    </section>
  )
}