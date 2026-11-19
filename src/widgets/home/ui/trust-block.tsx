// Иконки блока доверия - простые фигуры на токенах темы.
function ShieldIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-6 w-6">
      <path
        d="M12 3 L20 6 V12 C20 16.5 16.5 19.5 12 21 C7.5 19.5 4 16.5 4 12 V6 Z"
        stroke="var(--color-primary)"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M8.5 12 L11 14.5 L15.5 9.5"
        stroke="var(--color-primary)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

// Замок - безопасная сделка.
function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-6 w-6">
      <rect
        x="4.5"
        y="10.5"
        width="15"
        height="10"
        rx="2.5"
        stroke="var(--color-primary)"
        strokeWidth="2"
      />
      <path
        d="M8.5 10.5 V7.5 C8.5 6.1 10.1 4.8 12 4.8 C13.9 4.8 15.5 6.1 15.5 7.5 V10.5"
        stroke="var(--color-primary)"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="12" cy="15" r="1.4" fill="var(--color-primary)" />
    </svg>
  )
}

// Звезда - отзывы покупателей.
function StarIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-6 w-6">
      <path
        d="M12 4 L14.6 9.2 L20.3 9.9 L16.2 13.9 L17.3 19.5 L12 16.7 L6.7 19.5 L7.8 13.9 L3.7 9.9 L9.4 9.2 Z"
        stroke="var(--color-primary)"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  )
}

// Пункты доверия: чем защищены покупатель и мастер.
const TRUST_ITEMS = [
  {
    icon: ShieldIcon,
    title: 'Модерация контента',
    description: 'Каждое объявление и отзыв проверяет модератор до публикации.',
  },
  {
    icon: LockIcon,
    title: 'Безопасная сделка',
    description: 'Оплата проходит через платформу, деньги доходят до продавца после отправки.',
  },
  {
    icon: StarIcon,
    title: 'Отзывы',
    description: 'Реальные впечатления покупателей помогают выбрать мастера.',
  },
]
export function TrustBlock() {
  return (
    <section className="mt-8">
      <h2 className="mb-3 text-lg font-bold tracking-tight text-text">Почему нам можно доверять</h2>
      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {TRUST_ITEMS.map(({ icon: Icon, title, description }) => (
          <li
            key={title}
            className="flex flex-col gap-2 rounded-card border border-border bg-surface p-4 shadow-soft"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-muted">
              <Icon />
            </span>
            <h3 className="text-base font-semibold text-text">{title}</h3>
            <p className="text-sm leading-relaxed text-text-muted">{description}</p>
          </li>
        ))}
      </ul>
    </section>
  )
}