import { Link } from 'react-router-dom'

import { routes } from '@/shared/config/routes'
import { Badge } from '@/shared/ui/badge/badge'

export default function AboutPage() {
  return (
    <section className="mx-auto max-w-3xl space-y-6 p-8">
      <div className="space-y-2">
        <Badge variant="amber">Требует проверки</Badge>
        <h1 className="text-2xl font-semibold text-text">О проекте</h1>
        <p className="text-text-muted">
          kindis.kids — маркетплейс handmade для детей: изделия ручной работы от независимых мастеров
          и небольших семейных мастерских.
        </p>
      </div>

      <div className="space-y-4 text-sm text-text-muted">
        <p>
          Мы собираем в одном месте авторские поделки, украшения, игрушки и вещи для дома, чтобы
          родителям было проще находить вещи с историей, а мастерам — продавать свои работы без
          посредников.
        </p>
        <p>
          Каждый товар публикуется продавцом самостоятельно: фото, описание и цена принадлежат
          мастеру. Маркетплейс проверяет объявления перед публикацией, но не производит товары сам.
        </p>
        <p>Проект развивается: разделы появляются по мере запуска новых возможностей.</p>
      </div>

      <div className="flex flex-wrap gap-4 text-sm">
        <Link to={routes.catalog} className="text-primary hover:underline">
          Перейти в каталог
        </Link>
        <Link to={routes.forBusiness} className="text-primary hover:underline">
          Продавцам и мастерским
        </Link>
      </div>

      <p className="text-sm text-text-muted">Текст страницы требует редактуры перед публикацией.</p>
    </section>
  )
}