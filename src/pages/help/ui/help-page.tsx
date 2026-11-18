import { Link } from 'react-router-dom'

import { routes } from '@/shared/config/routes'
import { Badge } from '@/shared/ui/badge/badge'

// FAQ: пока шаблонный текст — раздел ждёт наполнения оператором.
const FAQ_ITEMS = [
  {
    question: 'Как оформить заказ?',
    answer:
      'Положите товар в корзину, перейдите к оформлению и заполните адрес доставки. Оплата и подтверждение заказа проходят в кабинете.',
  },
  {
    question: 'Сколько идёт доставка?',
    answer:
      'Сроки зависят от продавца и региона и указываются на странице товара. Точные даты появятся в заказе после отправки.',
  },
  {
    question: 'Как связаться с продавцом?',
    answer:
      'Напишите продавцу в чате заказа: раздел «Кабинет» → «Заказы» → выберите заказ и откройте переписку.',
  },
  {
    question: 'Что делать, если товар не подошёл?',
    answer:
      'Вернуть handmade-изделие можно по договорённости с продавцом. Опишите ситуацию в чате заказа — продавец предложит вариант.',
  },
]

export default function HelpPage() {
  return (
    <section className="mx-auto max-w-3xl space-y-6 p-8">
      <div className="space-y-2">
        <Badge variant="amber">Требует проверки</Badge>
        <h1 className="text-2xl font-semibold text-text">Помощь</h1>
        <p className="text-text-muted">
          Ответы на частые вопросы о заказах, доставке и возврате. Не нашли ответ — напишите в{' '}
          <Link to={routes.cabinetChats} className="text-primary hover:underline">
            чат поддержки
          </Link>
          .
        </p>
      </div>

      <ul className="space-y-4">
        {FAQ_ITEMS.map((item) => (
          <li key={item.question} className="rounded-card border border-border p-4">
            <h2 className="font-semibold text-text">{item.question}</h2>
            <p className="mt-1 text-sm text-text-muted">{item.answer}</p>
          </li>
        ))}
      </ul>

      <p className="text-sm text-text-muted">
        Раздел наполняется: тексты ответов уточняются вместе со службой поддержки.
      </p>
    </section>
  )
}