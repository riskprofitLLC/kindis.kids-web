// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest'

import {
  moveMedia,
  moveWithinOrder,
  readMediaLayout,
  setMainPhoto,
  sortByOrder,
  withMainFirst,
  writeMediaLayout,
} from '@/features/child-profile/model/media-layout'

const OWNER = 'child-1'

beforeEach(() => {
  // Чистим раскладку владельца между тестами — хранилище общее на модуль.
  writeMediaLayout(OWNER, { photoOrder: [], videoOrder: [], mainPhotoId: null })
})

describe('readMediaLayout / writeMediaLayout', () => {
  it('несохранённая раскладка читается пустой', () => {
    expect(readMediaLayout('child-absent')).toEqual({
      photoOrder: [],
      videoOrder: [],
      mainPhotoId: null,
    })
  })

  it('сохранённая раскладка читается обратно', () => {
    const layout = { photoOrder: ['m-1', 'm-2'], videoOrder: [], mainPhotoId: 'm-1' }

    expect(writeMediaLayout(OWNER, layout)).toEqual(layout)
    expect(readMediaLayout(OWNER)).toEqual(layout)
  })

  it('битый JSON в хранилище не роняет чтение', () => {
    // Имитируем испорченную запись из прошлой версии приложения.
    localStorage.setItem(`kindis-media-layout:${OWNER}`, '{не json')

    expect(readMediaLayout(OWNER)).toEqual({
      photoOrder: [],
      videoOrder: [],
      mainPhotoId: null,
    })
  })

  it('мусорные id в записи отфильтровываются', () => {
    localStorage.setItem(
      `kindis-media-layout:${OWNER}`,
      JSON.stringify({ photoOrder: ['m-1', 42, null], videoOrder: 'нет', mainPhotoId: 7 }),
    )

    expect(readMediaLayout(OWNER)).toEqual({
      photoOrder: ['m-1'],
      videoOrder: [],
      mainPhotoId: null,
    })
  })
})

describe('setMainPhoto', () => {
  it('ставит и снимает главное фото', () => {
    writeMediaLayout(OWNER, { photoOrder: ['m-1'], videoOrder: [], mainPhotoId: null })

    expect(setMainPhoto(OWNER, 'm-1').mainPhotoId).toBe('m-1')
    expect(setMainPhoto(OWNER, null).mainPhotoId).toBeNull()
  })
})

describe('moveWithinOrder', () => {
  it('меняет местами соседей', () => {
    expect(moveWithinOrder(['a', 'b', 'c'], 'c', 'left')).toEqual(['a', 'c', 'b'])
    expect(moveWithinOrder(['a', 'b', 'c'], 'a', 'right')).toEqual(['b', 'a', 'c'])
  })

  it('на границах порядок не меняется', () => {
    expect(moveWithinOrder(['a', 'b'], 'a', 'left')).toEqual(['a', 'b'])
    expect(moveWithinOrder(['a', 'b'], 'b', 'right')).toEqual(['a', 'b'])
  })

  it('неизвестный id не ломает порядок', () => {
    expect(moveWithinOrder(['a', 'b'], 'z', 'left')).toEqual(['a', 'b'])
  })
})

describe('moveMedia', () => {
  it('сдвигает фото и не трогает видео того же владельца', () => {
    writeMediaLayout(OWNER, {
      photoOrder: ['p-1', 'p-2'],
      videoOrder: ['v-1'],
      mainPhotoId: null,
    })

    const layout = moveMedia(OWNER, 'photo', 'p-2', 'left', ['p-1', 'p-2'])

    expect(layout.photoOrder).toEqual(['p-2', 'p-1'])
    expect(layout.videoOrder).toEqual(['v-1'])
  })
})

describe('sortByOrder / withMainFirst', () => {
  it('сортирует по сохранённому порядку, новые файлы — в конец', () => {
    const items = [{ id: 'n-1' }, { id: 'm-2' }, { id: 'm-1' }]

    expect(sortByOrder(items, ['m-2', 'm-1'])).toEqual([{ id: 'm-2' }, { id: 'm-1' }, { id: 'n-1' }])
  })

  it('главное фото уходит первым, отсутствие главного не меняет порядок', () => {
    const items = [{ id: 'a' }, { id: 'b' }, { id: 'c' }]

    expect(withMainFirst(items, null)).toBe(items)
    expect(withMainFirst(items, 'c')).toEqual([{ id: 'c' }, { id: 'a' }, { id: 'b' }])
    // Главное не из списка — список без изменений.
    expect(withMainFirst(items, 'z')).toBe(items)
  })
})