// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { Dialog } from '@/shared/ui/dialog/dialog'

const noop = () => {}

afterEach(cleanup)

describe('Dialog', () => {
  it('без описания связывает aria-describedby со скрытым текстом', () => {
    render(
      <Dialog open onOpenChange={noop} title="Отозвать согласие?">
        <p>Действие нельзя отменить.</p>
      </Dialog>,
    )

    const dialog = screen.getByRole('dialog')
    const describedBy = dialog.getAttribute('aria-describedby')
    expect(describedBy).toBeTruthy()

    const description = document.getElementById(describedBy as string)
    expect(description?.textContent).toBeTruthy()
    // Для скринридера，но не для глаза.
    expect(description?.className).toContain('sr-only')
  })

  it('переданное описание видно и связано с диалогом', () => {
    render(
      <Dialog open onOpenChange={noop} title="Удалить адрес?" description="Адрес исчезнет из книги.">
        <p>Точно?</p>
      </Dialog>,
    )

    const dialog = screen.getByRole('dialog')
    const description = document.getElementById(
      dialog.getAttribute('aria-describedby') as string,
    )
    expect(screen.getByText('Адрес исчезнет из книги.')).toBeTruthy()
    expect(description?.className).not.toContain('sr-only')
  })
})