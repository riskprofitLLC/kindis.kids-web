interface PageStubProps {
  title: string
  note?: string
}

// Универсальная заглушка раздела до реализации соответствующего этапа
export function PageStub({ title, note }: PageStubProps) {
  return (
    <section className="mx-auto max-w-3xl p-8">
      <h1 className="text-xl font-semibold text-text">{title}</h1>
      <p className="mt-2 text-text-muted">{note ?? 'Раздел в разработке.'}</p>
    </section>
  )
}
