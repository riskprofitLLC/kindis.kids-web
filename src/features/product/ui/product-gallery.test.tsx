// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { ProductGallery } from '@/features/product/ui/product-gallery'
import type { ProductMedia } from '@/shared/api/catalog-api'

// Ссылки на чтение приходят извне — подставляем фиксированный ответ.
vi.mock('@/features/media/model/use-media-url', () => ({
  useMediaUrl: () => 'https://storage.example/media.jpg',
}))

afterEach(cleanup)

const photo: ProductMedia = { id: 'm-photo', kind: 'photo' }
const video: ProductMedia = { id: 'm-video', kind: 'video' }

describe('ProductGallery', () => {
  it('без медиа показывает заглушку', () => {
    render(
      <MemoryRouter>
        <ProductGallery title="Шкатулка" media={[]} />
      </MemoryRouter>,
    )

    expect(screen.getByText('Фото пока нет')).toBeTruthy()
  })

  it('рендерит фото активного медиа', () => {
    const { container } = render(
      <MemoryRouter>
        <ProductGallery title="Шкатулка" media={[photo]} />
      </MemoryRouter>,
    )

    const image = container.querySelector('img')
    expect(image).not.toBeNull()
    expect(image?.getAttribute('src')).toBe('https://storage.example/media.jpg')
    expect(image?.getAttribute('alt')).toBe('Шкатулка')
  })

  it('видео рисует плеером,а не битой картинкой', () => {
    const { container } = render(
      <MemoryRouter>
        <ProductGallery title="Шкатулка" media={[video]} />
      </MemoryRouter>,
    )

    expect(container.querySelector('img')).toBeNull()
    const player = container.querySelector('video')
    expect(player).not.toBeNull()
    expect(player?.getAttribute('controls')).not.toBeNull()
  })

  it('миниатюр нет при одном медиа', () => {
    const { container } = render(
      <MemoryRouter>
        <ProductGallery title="Шкатулка" media={[photo]} />
      </MemoryRouter>,
    )

    // Миниатюры живут в списке под главным медиа.
    expect(container.querySelectorAll('ul li').length).toBe(0)
  })
})