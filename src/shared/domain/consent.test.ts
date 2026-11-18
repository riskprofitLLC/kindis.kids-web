import { describe, expect, it } from 'vitest'

import {
  CONSENT_DOCUMENT_DATE,
  CONSENT_DOCUMENT_VERSION,
  consentParagraphs,
} from '@/shared/domain/consent'

describe('согласие на спецданные', () => {
  it('версия совпадает с бэкендовой (оттуда же приходит ошибка «устарела»)', () => {
    expect(CONSENT_DOCUMENT_VERSION).toMatch(/^\d+\.\d+$/)
  })

  it('дата документа читаема', () => {
    expect(CONSENT_DOCUMENT_DATE).toMatch(/\d{4}/)
  })

  it('текст согласия непустой и без пустых абзацев', () => {
    expect(consentParagraphs.length).toBeGreaterThanOrEqual(4)
    for (const paragraph of consentParagraphs) {
      expect(paragraph.trim().length).toBeGreaterThan(50)
    }
  })

  it('в тексте упомянуты цель, отзыв и фото — обязательные пункты 152-ФЗ', () => {
    const text = consentParagraphs.join(' ')

    expect(text).toContain('Цель обработки')
    expect(text.toLowerCase()).toContain('отзыв')
    expect(text.toLowerCase()).toContain('фотограф')
  })
})
