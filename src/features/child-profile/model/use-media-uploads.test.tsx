// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  requestUploadUrl: vi.fn(),
  uploadToStorage: vi.fn(),
  completeUpload: vi.fn(),
  readVideoDuration: vi.fn(),
  captureVideoFrame: vi.fn(),
}))

vi.mock('@/shared/api/media-api', () => ({
  mediaApi: {
    requestUploadUrl: (...args: unknown[]) => mocks.requestUploadUrl(...args),
    uploadToStorage: (...args: unknown[]) => mocks.uploadToStorage(...args),
    completeUpload: (...args: unknown[]) => mocks.completeUpload(...args),
  },
}))

vi.mock('@/shared/lib/video-metadata', () => ({
  readVideoDuration: (...args: unknown[]) => mocks.readVideoDuration(...args),
  captureVideoFrame: (...args: unknown[]) => mocks.captureVideoFrame(...args),
}))

import { useMediaUploads } from '@/features/child-profile/model/use-media-uploads'

const OWNER = 'child-1'
const TICKET = { mediaId: 'media-1', uploadUrl: 'https://storage/put' }
const ASSET = { id: 'media-1' }

let createdUrls: string[]
let revokedUrls: string[]
let originalCreate: typeof URL.createObjectURL | undefined
let originalRevoke: typeof URL.revokeObjectURL | undefined

function photo(name = 'photo.jpg'): File {
  return new File([new Uint8Array([1, 2, 3])], name, { type: 'image/jpeg' })
}

function video(name = 'clip.mp4'): File {
  return new File([new Uint8Array([1, 2, 3])], name, { type: 'video/mp4' })
}

function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

let client: QueryClient

function wrapper({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}

beforeEach(() => {
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  createdUrls = []
  revokedUrls = []
  originalCreate = URL.createObjectURL
  originalRevoke = URL.revokeObjectURL
  Object.defineProperty(URL, 'createObjectURL', {
    configurable: true,
    writable: true,
    value: () => {
      const url = `blob:mock-${createdUrls.length}`
      createdUrls.push(url)
      return url
    },
  })
  Object.defineProperty(URL, 'revokeObjectURL', {
    configurable: true,
    writable: true,
    value: (url: string) => {
      revokedUrls.push(url)
    },
  })
  mocks.requestUploadUrl.mockReset().mockResolvedValue(TICKET)
  mocks.uploadToStorage.mockReset().mockResolvedValue(undefined)
  mocks.completeUpload.mockReset().mockResolvedValue(ASSET)
  mocks.readVideoDuration.mockReset().mockResolvedValue(0)
  mocks.captureVideoFrame.mockReset().mockResolvedValue(null)
})

afterEach(() => {
  Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: originalCreate })
  Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: originalRevoke })
})

describe('useMediaUploads', () => {
  it('невалидный формат сразу даёт ошибку, не трогая превью и метаданные', async () => {
    const { result } = renderHook(() => useMediaUploads(OWNER, 'photo'), { wrapper })

    await act(async () => {
      await result.current.start(new File([new Uint8Array([1])], 'note.txt', { type: 'text/plain' }))
    })

    expect(result.current.tasks).toHaveLength(1)
    expect(result.current.tasks[0].status).toBe('error')
    expect(result.current.tasks[0].error).toContain('Недопустимый формат')
    // Проверка идёт до превью и до чтения метаданных — никаких лишних операций.
    expect(createdUrls).toEqual([])
    expect(mocks.readVideoDuration).not.toHaveBeenCalled()
    expect(mocks.requestUploadUrl).not.toHaveBeenCalled()
  })

  it('невалидный файл не появляется в списке как uploading', async () => {
    const seen: string[][] = []
    const view = renderHook(
      () => {
        const value = useMediaUploads(OWNER, 'photo')
        seen.push(value.tasks.map((task) => task.status))
        return value
      },
      { wrapper },
    )

    await act(async () => {
      await view.result.current.start(
        new File([new Uint8Array([1])], 'note.txt', { type: 'text/plain' }),
      )
    })

    expect(seen.every((snapshot) => !snapshot.includes('uploading'))).toBe(true)
    expect(view.result.current.tasks[0].status).toBe('error')
  })
})

describe('useMediaUploads порядок операций', () => {
  it('фото: проверка → превью → загрузка → фиксация', async () => {
    const file = photo()
    const { result } = renderHook(() => useMediaUploads(OWNER, 'photo'), { wrapper })

    await act(async () => {
      await result.current.start(file)
    })

    expect(createdUrls).toHaveLength(1)
    expect(mocks.requestUploadUrl).toHaveBeenCalledTimes(1)
    expect(mocks.requestUploadUrl).toHaveBeenCalledWith({
      ownerType: 'child_profile',
      ownerId: OWNER,
      kind: 'photo',
      fileName: file.name,
      mimeType: file.type,
      sizeBytes: file.size,
    })
    expect(mocks.completeUpload).toHaveBeenCalledWith('media-1', { durationSeconds: undefined })
    expect(result.current.tasks[0].status).toBe('done')
    expect(result.current.tasks[0].mediaId).toBe('media-1')
  })

  it('прогресс загрузки попадает в задачу', async () => {
    const gate = deferred<void>()
    mocks.uploadToStorage.mockImplementation((_url, _file, onProgress) => {
      onProgress?.(42)
      return gate.promise
    })
    const view = renderHook(() => useMediaUploads(OWNER, 'photo'), { wrapper })

    await act(async () => {
      void view.result.current.start(photo())
      for (let step = 0; step < 5; step += 1) await Promise.resolve()
    })

    expect(view.result.current.tasks[0].percent).toBe(42)

    gate.resolve()
    await act(async () => {})

    expect(view.result.current.tasks[0].status).toBe('done')
    expect(view.result.current.tasks[0].percent).toBe(100)
  })
})

describe('useMediaUploads видео', () => {
  it('метаданные читаются до загрузки, длительность уходит на сервер', async () => {
    mocks.readVideoDuration.mockResolvedValue(42)
    mocks.captureVideoFrame.mockResolvedValue('data:image/jpeg;base64,poster')
    const file = video()
    const { result } = renderHook(() => useMediaUploads(OWNER, 'video'), { wrapper })

    await act(async () => {
      await result.current.start(file)
    })

    expect(mocks.readVideoDuration).toHaveBeenCalledWith(file)
    expect(mocks.completeUpload).toHaveBeenCalledWith('media-1', { durationSeconds: 42 })
    expect(result.current.tasks[0].durationSeconds).toBe(42)
    expect(result.current.tasks[0].posterUrl).toBe('data:image/jpeg;base64,poster')
  })

  it('видео длиннее лимита не загружается', async () => {
    mocks.readVideoDuration.mockResolvedValue(181)
    const { result } = renderHook(() => useMediaUploads(OWNER, 'video'), { wrapper })

    await act(async () => {
      await result.current.start(video())
    })

    expect(result.current.tasks[0].status).toBe('error')
    expect(result.current.tasks[0].error).toContain('180')
    expect(mocks.requestUploadUrl).not.toHaveBeenCalled()
  })
})

describe('useMediaUploads retry', () => {
  it('повтор работает с актуальным состоянием через устаревшее замыкание', async () => {
    mocks.readVideoDuration.mockResolvedValue(42)
    mocks.completeUpload.mockRejectedValueOnce(new Error('Сеть недоступна'))
    const view = renderHook(() => useMediaUploads(OWNER, 'video'), { wrapper })
    // Замыкание из первого рендера — список задач в нём ещё пуст.
    const earlyRetry = view.result.current.retry

    await act(async () => {
      await view.result.current.start(video())
    })
    expect(view.result.current.tasks[0].status).toBe('error')

    act(() => earlyRetry(view.result.current.tasks[0].id))
    await act(async () => {})

    expect(view.result.current.tasks[0].status).toBe('done')
    // Длительность взята из ref, а не из устаревшего замыкания.
    expect(mocks.completeUpload).toHaveBeenLastCalledWith('media-1', { durationSeconds: 42 })
  })

  it('повтор без сохранённого файла ничего не делает', async () => {
    const { result } = renderHook(() => useMediaUploads(OWNER, 'photo'), { wrapper })

    act(() => result.current.retry('нет-такой'))

    expect(mocks.requestUploadUrl).not.toHaveBeenCalled()
  })
})

describe('useMediaUploads превью', () => {
  it('ссылка освобождается после успешной загрузки', async () => {
    const { result } = renderHook(() => useMediaUploads(OWNER, 'photo'), { wrapper })

    await act(async () => {
      await result.current.start(photo())
    })

    expect(createdUrls).toHaveLength(1)
    expect(revokedUrls).toEqual(createdUrls)
    expect(result.current.tasks[0].previewUrl).toBeUndefined()
  })

  it('ссылка освобождается после ошибки', async () => {
    mocks.requestUploadUrl.mockRejectedValueOnce(new Error('Сеть недоступна'))
    const { result } = renderHook(() => useMediaUploads(OWNER, 'photo'), { wrapper })

    await act(async () => {
      await result.current.start(photo())
    })

    expect(result.current.tasks[0].status).toBe('error')
    expect(revokedUrls).toEqual(createdUrls)
  })

  it('ссылка освобождается после отмены', async () => {
    const gate = deferred<void>()
    mocks.uploadToStorage.mockReturnValue(gate.promise)
    const view = renderHook(() => useMediaUploads(OWNER, 'photo'), { wrapper })

    await act(async () => {
      void view.result.current.start(photo())
      // Прокидываем микрозадачи до вызова загрузки в хранилище.
      for (let step = 0; step < 5; step += 1) await Promise.resolve()
    })

    act(() => view.result.current.cancel(view.result.current.tasks[0].id))
    gate.reject(new Error('aborted'))
    await act(async () => {})

    expect(view.result.current.tasks[0].status).toBe('canceled')
    expect(revokedUrls).toEqual(createdUrls)
  })
})

describe('useMediaUploads удаление', () => {
  it('после done убирает задачу и не освобождает ссылку повторно', async () => {
    const { result } = renderHook(() => useMediaUploads(OWNER, 'photo'), { wrapper })

    await act(async () => {
      await result.current.start(photo())
    })
    const revokedBefore = [...revokedUrls]

    act(() => result.current.remove(result.current.tasks[0].id))

    expect(result.current.tasks).toEqual([])
    expect(revokedUrls).toEqual(revokedBefore)
  })

  it('удаление во время загрузки снимает запрос', async () => {
    const gate = deferred<void>()
    mocks.uploadToStorage.mockReturnValue(gate.promise)
    const view = renderHook(() => useMediaUploads(OWNER, 'photo'), { wrapper })

    await act(async () => {
      void view.result.current.start(photo())
      for (let step = 0; step < 5; step += 1) await Promise.resolve()
    })
    const id = view.result.current.tasks[0].id

    act(() => view.result.current.remove(id))
    gate.reject(new Error('aborted'))
    await act(async () => {})

    expect(view.result.current.tasks).toEqual([])
    expect(mocks.completeUpload).not.toHaveBeenCalled()
  })
})
