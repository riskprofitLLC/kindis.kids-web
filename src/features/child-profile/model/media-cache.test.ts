// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest'

import {
  addCachedMedia,
  patchCachedMedia,
  readCachedMedia,
  removeCachedMedia,
  writeCachedMedia,
} from '@/features/child-profile/model/media-cache'
import type { MediaAsset } from '@/shared/api/media-api'
import { storage } from '@/shared/lib/storage/web-storage'

const OWNER = 'child-1'

function asset(id: string): MediaAsset {
  return {
    id,
    ownerType: 'child_profile',
    ownerId: OWNER,
    kind: 'photo',
    storageKey: `media/${id}`,
    mimeType: 'image/jpeg',
    sizeBytes: 1024,
    durationSeconds: null,
    width: null,
    height: null,
    status: 'ready',
    moderatedAt: null,
  }
}

beforeEach(() => {
  storage.removeItem(`kindis-media-cache:${OWNER}`)
})

describe('media-cache', () => {
  it('пустой кеш читается как пустой список', () => {
    expect(readCachedMedia(OWNER)).toEqual([])
  })

  it('запись и чтение переживают «перезагрузку»', () => {
    writeCachedMedia(OWNER, [asset('m-1'), asset('m-2')])

    expect(readCachedMedia(OWNER).map((item) => item.id)).toEqual(['m-1', 'm-2'])
  })

  it('битый JSON не роняет чтение', () => {
    storage.setItem(`kindis-media-cache:${OWNER}`, '{не json')

    expect(readCachedMedia(OWNER)).toEqual([])
  })

  it('не массив в хранилище тоже даёт пустой список', () => {
    storage.setItem(`kindis-media-cache:${OWNER}`, '{"id":"m-1"}')

    expect(readCachedMedia(OWNER)).toEqual([])
  })

  it('add заменяет медиа с тем же id вместо дубля', () => {
    addCachedMedia(OWNER, asset('m-1'))
    const next = addCachedMedia(OWNER, { ...asset('m-1'), sizeBytes: 2048 } as MediaAsset)

    expect(next).toHaveLength(1)
    expect(next[0].sizeBytes).toBe(2048)
  })

  it('remove убирает только своё медиа', () => {
    addCachedMedia(OWNER, asset('m-1'))
    addCachedMedia(OWNER, asset('m-2'))

    const next = removeCachedMedia(OWNER, 'm-1')

    expect(next.map((item) => item.id)).toEqual(['m-2'])
    // Несуществующее удаление не ломает список.
    expect(removeCachedMedia(OWNER, 'm-x').map((item) => item.id)).toEqual(['m-2'])
  })

  it('patch точечно обновляет поля', () => {
    addCachedMedia(OWNER, asset('m-1'))

    const next = patchCachedMedia(OWNER, 'm-1', { sizeBytes: 4096 } as Partial<MediaAsset>)

    expect(next[0]).toMatchObject({ id: 'm-1', sizeBytes: 4096 })
  })
})