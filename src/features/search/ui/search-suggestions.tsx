import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { useSuggestions } from '@/features/search/model/use-suggestions'
import { routes } from '@/shared/config/routes'
import { cn } from '@/shared/lib/cn'

interface SearchSuggestionsProps {
  className?: string
  // Плейсхолдер и подпись кнопки позволяют переиспользовать строку в шапке и на главной.
  placeholder?: string
  submitLabel?: string
}

// Строка поиска с живыми подсказками: debounce 300 мс, навигация стрелками.
export function SearchSuggestions({
  className,
  placeholder = 'Найти поделку',
  submitLabel,
}: SearchSuggestionsProps) {
  const navigate = useNavigate()
  const listboxId = useId()
  const inputRef = useRef<HTMLInputElement>(null)

  const [term, setTerm] = useState('')
  const [debounced, setDebounced] = useState('')
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  // Таймер закрытия по blur живёт вне эффекта — храним в ref, чтобы снять его при размонтировании.
  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Debounce 300 мс — не дёргаем каталог на каждую букву.
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(term), 300)
    return () => clearTimeout(timer)
  }, [term])

  // Снимаем отложенный blur-таймер при размонтировании — иначе setState после теста.
  useEffect(() => () => {
    if (blurTimer.current !== null) clearTimeout(blurTimer.current)
  }, [])

  const suggestions = useSuggestions(debounced)
  const items = useMemo(
    () => (open && debounced.trim().length >= 2 ? (suggestions.data ?? []) : []),
    [open, debounced, suggestions.data],
  )

  const goToResults = (query: string) => {
    const trimmed = query.trim()
    if (!trimmed) return
    setOpen(false)
    setActiveIndex(-1)
    void navigate(`${routes.search}?q=${encodeURIComponent(trimmed)}`)
  }

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setOpen(true)
      setActiveIndex((index) => (items.length === 0 ? -1 : (index + 1) % items.length))
      return
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActiveIndex((index) =>
        items.length === 0 ? -1 : (index - 1 + items.length) % items.length,
      )
      return
    }
    if (event.key === 'Escape') {
      setOpen(false)
      setActiveIndex(-1)
      return
    }
    if (event.key === 'Enter') {
      event.preventDefault()
      const active = items[activeIndex]
      if (active) {
        void navigate(routes.product(active.id))
        setOpen(false)
        return
      }
      goToResults(term)
    }
  }

  return (
    <div className={cn('relative', className)}>
      <div className="flex">
        <input
          ref={inputRef}
          type="search"
          role="combobox"
          aria-expanded={items.length > 0}
          aria-controls={listboxId}
          aria-autocomplete="list"
          aria-label="Поиск по каталогу"
          placeholder={placeholder}
          value={term}
          onChange={(event) => {
            setTerm(event.target.value)
            setOpen(true)
            setActiveIndex(-1)
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => {
            if (blurTimer.current !== null) clearTimeout(blurTimer.current)
            blurTimer.current = setTimeout(() => {
              blurTimer.current = null
              setOpen(false)
            }, 150)
          }}
          onKeyDown={onKeyDown}
          className={cn(
            'min-h-11 w-full rounded-control border border-border bg-surface px-3 py-2 text-sm text-text placeholder:text-text-muted focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-primary',
            submitLabel && 'rounded-r-none border-r-0',
          )}
        />

        {/* Кнопка «Найти» примыкает к полю — единый скруглённый блок как у Avito */}
        {submitLabel && (
          <button
            type="button"
            onClick={() => goToResults(term)}
            className="min-h-11 shrink-0 rounded-r-control bg-primary px-5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-hover focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            {submitLabel}
          </button>
        )}
      </div>

      {items.length > 0 && (
        <ul
          id={listboxId}
          role="listbox"
          aria-label="Подсказки поиска"
          className="absolute left-0 right-0 top-full z-30 mt-1 overflow-hidden rounded-control border border-border bg-surface shadow-lg"
        >
          {items.map((product, index) => (
            <li key={product.id} role="option" aria-selected={index === activeIndex}>
              <Link
                to={routes.product(product.id)}
                className={cn(
                  'block px-3 py-2 text-sm text-text',
                  index === activeIndex && 'bg-surface-muted',
                )}
                onMouseEnter={() => setActiveIndex(index)}
              >
                {product.title}
                <span className="ml-2 text-xs text-text-muted">{product.sellerName}</span>
              </Link>
            </li>
          ))}
          <li>
            <button
              type="button"
              className="block w-full min-h-11 px-3 py-2 text-left text-sm text-primary hover:bg-surface-muted"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => goToResults(debounced)}
            >
              Все результаты по «{debounced}»
            </button>
          </li>
        </ul>
      )}
    </div>
  )
}
