// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { HowItWorks } from '@/widgets/home/ui/how-it-works'

describe('HowItWorks', () => {
  it('рисует заголовок и три шага', () => {
    render(<HowItWorks />)

    expect(screen.getByRole('heading', { name: 'Как это работает' })).toBeTruthy()

    const steps = screen.getAllByRole('listitem')
    expect(steps).toHaveLength(3)
    expect(screen.getByText('Выбери поделку')).toBeTruthy()
    expect(screen.getByText('Поддержи мастера')).toBeTruthy()
    expect(screen.getByText('Получи посылку')).toBeTruthy()
  })

  it('нумерует шаги упорядоченным списком', () => {
    const { container } = render(<HowItWorks />)

    const list = container.querySelector('ol')
    expect(list).not.toBeNull()
    expect(list?.querySelectorAll('li')).toHaveLength(3)
  })
})