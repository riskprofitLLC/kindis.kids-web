// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { Lightbox } from '@/shared/ui/lightbox/lightbox'

afterEach(cleanup)

describe('Lightbox', () => {
  it('заголовок и скрытое описание связаны с окном', () => {
    render(
      <Lightbox open onOpenChange={() => {}} title="Бусы из бисера">
        <img src="/media.jpg" alt="Бусы из бисера" />
      </Lightbox>,
    )

    const dialog = screen.getByRole('dialog')
    expect(dialog.getAttribute('aria-labelledby')).toBeTruthy()
    expect(screen.getByText('Бусы из бисера')).toBeTruthy()

    const description = document.getElementById(
      dialog.getAttribute('aria-describedby') as string,
    )
    expect(description?.textContent).toContain('Просмотр медиа крупно')
    // Описание только для скринридера.
    expect(description?.className).toContain('sr-only')
  })
})