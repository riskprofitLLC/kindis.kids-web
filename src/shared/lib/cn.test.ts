import { describe, expect, it } from 'vitest'

import { cn } from '@/shared/lib/cn'

describe('cn', () => {
  it('склеивает классы через пробел', () => {
    expect(cn('p-4', 'text-sm')).toBe('p-4 text-sm')
  })

  it('условные классы: falsy отбрасываются', () => {
    expect(cn('p-4', false && 'hidden', undefined, null, 'text-sm')).toBe('p-4 text-sm')
  })

  it('последний конфликтующий Tailwind-класс побеждает', () => {
    expect(cn('p-4', 'p-6')).toBe('p-6')
    expect(cn('text-sm', 'text-lg')).toBe('text-lg')
  })

  it('неконфликтующие классы сохраняются оба', () => {
    expect(cn('rounded-card', 'border')).toBe('rounded-card border')
  })

  it('пустой вызов даёт пустую строку', () => {
    expect(cn()).toBe('')
  })
})