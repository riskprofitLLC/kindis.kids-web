import { beforeEach, describe, expect, it, vi } from 'vitest'

// Медиа зовёт GET/POST/DELETE клиента плюс прямую загрузку через axios.
const get = vi.fn()
const post = vi.fn()
const del = vi.fn()
const put = vi.fn()

vi.mock('@/shared/api/client', () => ({
  api: {
    get: (...args: unknown[]) => get(...args),
    post: (...args: unknown[]) => post(...args),
    delete: (...args: unknown[]) => del(...args),
  },
}))

// Прямая загрузка идёт мимо api-инстанса — мокаем сам axios.
vi.mock('axios', () => ({
  default: {
    put: (...args: unknown[]) => put(...args),
  },
}))

const { mediaApi } = await import('@/shared/api/media-api')

function makeFile() {
  return new File(['x'], 'a.png', { type: 'image/png' })
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('mediaApi.requestUploadUrl', () => {
  it('шлёт метаданные файла и возвращает тикет на загрузку', async () => {
    const ticket = { mediaId: 'm-1', uploadUrl: 'https://silo/put' }
    post.mockResolvedValueOnce({ data: ticket })

    await expect(
      mediaApi.requestUploadUrl({
        ownerType: 'product',
        ownerId: 'p-1',
        kind: 'photo',
        fileName: 'a.png',
        mimeType: 'image/png',
        sizeBytes: 1234,
      }),
    ).resolves.toEqual(ticket)
    expect(post).toHaveBeenCalledWith('/media/upload-url', {
      ownerType: 'product',
      ownerId: 'p-1',
      kind: 'photo',
      fileName: 'a.png',
      mimeType: 'image/png',
      sizeBytes: 1234,
    })
  })
})

describe('mediaApi.completeUpload', () => {
  it('передаёт метаданные обработки видео', async () => {
    const asset = { id: 'm-1' }
    post.mockResolvedValueOnce({ data: asset })

    await expect(
      mediaApi.completeUpload('m-1', { durationSeconds: 12 }),
    ).resolves.toEqual(asset)
    expect(post).toHaveBeenCalledWith('/media/m-1/complete', { durationSeconds: 12 })
  })

  it('без мета шлёт пустой объект', async () => {
    // Ветка meta ??: отсутствующие размеры превращаются в {}.
    post.mockResolvedValueOnce({ data: { id: 'm-2' } })

    await mediaApi.completeUpload('m-2')

    expect(post).toHaveBeenCalledWith('/media/m-2/complete', {})
  })
})

describe('mediaApi.getReadUrl / getOwnerReadUrl', () => {
  it('getReadUrl возвращает публичную ссылку проверенного медиа', async () => {
    get.mockResolvedValueOnce({ data:{ url:'ready' } })

    await expect(mediaApi.getReadUrl('abc')).resolves.toBe('ready')
    expect(get).toHaveBeenCalledWith('/media/'+'a'+'bc'+'/url')
  })

  it('getOwnerReadUrl возвращает ссылку владельца до модерации', async () => {
    get.mockResolvedValueOnce({ data:{ url:'owner-ready' } })

    await expect(mediaApi.getOwnerReadUrl('abc')).resolves.toBe('owner-ready')
    expect(get).toHaveBeenCalledWith('/media/'+'a'+'bc'+'/owner-url')
  })
})

describe('mediaApi.remove', () => {
  it('удаляет медиа по id', async () => {
    del.mockResolvedValueOnce({ data: null })

    await mediaApi.remove('abc')

    expect(del).toHaveBeenCalledWith('/media/'+'a'+'bc')
  })
})

describe('mediaApi.uploadToStorage', () => {
  it('кладёт файл в хранилище с типом и сигналом отмены', async () => {
    const controller=new AbortController()
    put.mockResolvedValueOnce({})

    await mediaApi.uploadToStorage(
      'https://silo/put',
      makeFile(),
      undefined,
      controller.signal,
    )

    const [urlArg, fileArg, options] = put.mock.calls[0]
    expect(urlArg).toBe('https://silo/put')
    expect(fileArg).toBeInstanceOf(File)
    expect(options.headers['Content-Type']).toBe('image/png')
    expect(options.signal).toBe(controller.signal)

// Без колбэка вызов прогресса наверх не должен падать.
expect(() => options.onUploadProgress({})).not.toThrow()
  })
})
