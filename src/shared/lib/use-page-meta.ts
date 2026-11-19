import { useEffect } from 'react'

export type PageMeta = {
  title?: string
  description?: string
  image?: string
  noindex?: boolean
}

type MetaAttr = 'name' | 'property'

// Создаёт или обновляет мету в head; запоминает сделанное для отката при размонтировании
function upsertMeta(
  attr: MetaAttr,
  key: string,
  content: string,
  created: HTMLElement[],
  restored: Array<[HTMLMetaElement, string | null]>,
): void {
  const existing = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`)
  if (existing) {
    restored.push([existing, existing.getAttribute('content')])
    existing.setAttribute('content', content)
    return
  }
  const el = document.createElement('meta')
  el.setAttribute(attr, key)
  el.setAttribute('content', content)
  document.head.appendChild(el)
  created.push(el)
}

// SEO-мета страницы на голом document API; при смене страницы откатывает свои правки
export function usePageMeta({ title, description, image, noindex }: PageMeta): void {
  useEffect(() => {
    const created: HTMLElement[] = []
    const restored: Array<[HTMLMetaElement, string | null]> = []

    if (title) document.title = title
    if (description) upsertMeta('name', 'description', description, created, restored)
    upsertMeta(
      'name',
      'robots',
      noindex ? 'noindex, nofollow' : 'index, follow',
      created,
      restored,
    )
    if (image) upsertMeta('property', 'og:image', image, created, restored)
    if (title) upsertMeta('property', 'og:title', title, created, restored)
    if (description) upsertMeta('property', 'og:description', description, created, restored)

    return () => {
      for (const el of created) el.remove()
      for (const [el, prev] of restored) {
        if (prev === null) el.removeAttribute('content')
        else el.setAttribute('content', prev)
      }
    }
  }, [title, description, image, noindex])
}