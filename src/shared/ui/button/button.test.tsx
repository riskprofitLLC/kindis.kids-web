// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { Button } from '@/shared/ui/button/button'

// Без globals RTL не чистит DOM сам — делаем это вручную между тестами.
afterEach(cleanup)

describe('Button', () => {
  it('рендерит текст и реагирует на клик', async () => {
    const onClick = vi.fn()
    render(<Button onClick={onClick}>Найти</Button>)

    const button = screen.getByRole('button', { name: 'Найти' })
    button.click()

    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('вариант outline добавляет класс границы', () => {
    render(<Button variant="outline">Фильтры</Button>)

    expect(screen.getByRole('button', { name: 'Фильтры' }).className).toContain('border')
  })

  it('вариант danger добавляет класс опасного цвета', () => {
    render(<Button variant="danger">Удалить</Button>)

    expect(screen.getByRole('button', { name: 'Удалить' }).className).toContain('bg-danger')
  })

  it('размер sm компактнее дефолтного', () => {
    render(
      <>
        <Button size="sm">Мелкая</Button>
        <Button>Обычная</Button>
      </>,
    )

    const small = screen.getByRole('button', { name: 'Мелкая' })
    const regular = screen.getByRole('button', { name: 'Обычная' })

    expect(small.className).toContain('h-9')
    expect(regular.className).toContain('h-11')
  })

  it('собственный className дополняет варианты', () => {
    render(<Button className="lg:hidden">Скрытая</Button>)

    const button = screen.getByRole('button', { name: 'Скрытая' })
    expect(button.className).toContain('lg:hidden')
  })

  it('disabled блокирует клик', () => {
    const onClick = vi.fn()
    render(
      <Button disabled onClick={onClick}>
        Недоступно
      </Button>,
    )

    const button = screen.getByRole('button', { name: 'Недоступно' }) as HTMLButtonElement
    button.click()

    expect(onClick).not.toHaveBeenCalled()
  })
})
