import { describe, expect, it } from 'vitest'

import {
  formatDuration,
  formatFileSize,
  MEDIA_LIMITS,
  validateMediaFile,
} from './media'

describe('validateMediaFile', () => {
  it('пропускает фото допустимого формата и размера', () => {
    const file = { name: 'a.jpg', type: 'image/jpeg', size: 1024 }

    expect(validateMediaFile('photo', file)).toEqual({ ok: true })
  })

  it('отсекает фото не того формата', () => {
    const file = { name: 'a.gif', type: 'image/gif', size: 1024 }

    expect(validateMediaFile('photo', file).ok).toBe(false)
  })

  it('отсекает фото больше лимита', () => {
    const file = { name: 'a.png', type: 'image/png', size: MEDIA_LIMITS.maxPhotoBytes + 1 }

    const result = validateMediaFile('photo', file)

    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.message).toContain('МБ')
  })

  it('отсекает видео не того формата', () => {
    const file = { name: 'a.mov', type: 'video/quicktime', size: 1024 }

    expect(validateMediaFile('video', file).ok).toBe(false)
  })

  it('пропускает видео в пределах размера', () => {
    const file = { name: 'a.mp4', type: 'video/mp4', size: 1024 }

    expect(validateMediaFile('video', file)).toEqual({ ok: true })
  })
})

describe('formatFileSize', () => {
  it('показывает байты, килобайты и мегабайты', () => {
    expect(formatFileSize(512)).toBe('512 Б')
    expect(formatFileSize(2048)).toBe('2 КБ')
    expect(formatFileSize(3 * 1024 * 1024)).toBe('3.0 МБ')
  })
})

describe('formatDuration', () => {
  it('переводит секунды в м:сс', () => {
    expect(formatDuration(9)).toBe('0:09')
    expect(formatDuration(75)).toBe('1:15')
    expect(formatDuration(180)).toBe('3:00')
  })
})
