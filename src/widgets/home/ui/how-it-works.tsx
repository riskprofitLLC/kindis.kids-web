// Шаги покупки на главной: как работает маркетплейс поделок.
const STEPS = [
  {
    title: 'Выбери поделку',
    description: 'В каталоге работы юных мастеров: рисунки, украшения, игрушки и текстиль.',
  },
  {
    title: 'Поддержи мастера',
    description: 'Оплата идет продавцу напрямую - ребенку и его семье на занятия и материалы.',
  },
  {
    title: 'Получи посылку',
    description: 'Продавец отправляет заказ, а вы оставляете отзыв о работе молодого мастера.',
  },
]

export function HowItWorks() {
  return (
    <section className="mt-8">
      <h2 className="mb-3 text-lg font-bold tracking-tight text-text">Как это работает</h2>
      <ol className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {STEPS.map((step, index) => (
          <li
            key={step.title}
            className="flex flex-col gap-2 rounded-card border border-border bg-surface p-4 shadow-soft"
          >
            <span
              aria-hidden="true"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-muted text-sm font-bold text-primary"
            >
              {index + 1}
            </span>
            <h3 className="text-base font-semibold text-text">{step.title}</h3>
            <p className="text-sm leading-relaxed text-text-muted">{step.description}</p>
          </li>
        ))}
      </ol>
    </section>
  )
}