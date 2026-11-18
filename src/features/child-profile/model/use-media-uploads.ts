import { useQueryClient } from '@tanstack/react-query'
import { useCallback, useRef, useState } from 'react'

import { profileMediaKey } from '@/features/child-profile/model/use-profile-media'
import { mediaApi } from '@/shared/api/media-api'
import { MEDIA_LIMITS, type MediaKind, validateMediaFile } from '@/shared/domain/media'
import { captureVideoFrame, readVideoDuration } from '@/shared/lib/video-metadata'

export interface UploadTask {
  id: string
  fileName: string
  kind: MediaKind
  sizeBytes: number
  status: 'uploading' | 'completing' | 'done' | 'error' | 'canceled'
  percent: number
  error?: string
  previewUrl?: string
  posterUrl?: string
  durationSeconds?: number
  mediaId?: string
}

interface PendingUpload {
  file: File
  durationSeconds?: number
}

// Загрузка одного файла: проверка → превью → метаданные → хранилище → фиксация.
export function useMediaUploads(ownerId: string, kind: MediaKind) {
  const [tasks, setTasks] = useState<UploadTask[]>([])
  const controllers = useRef(new Map<string, AbortController>())
  // Файл и длительность в ref — retry работает с актуальным состоянием, а не с замыканием рендера.
  const pending = useRef(new Map<string, PendingUpload>())
  const queryClient = useQueryClient()

  const patch = useCallback((id: string, values: Partial<UploadTask>) => {
    setTasks((current) => current.map((task) => (task.id === id ? { ...task, ...values } : task)))
  }, [])

  // Превью живёт до терминального статуса — дальше ссылку освобождаем.
  const releasePreview = useCallback((id: string) => {
    setTasks((current) => {
      const task = current.find((item) => item.id === id)
      if (!task?.previewUrl) return current
      URL.revokeObjectURL(task.previewUrl)
      return current.map((item) => (item.id === id ? { ...item, previewUrl: undefined } : item))
    })
  }, [])

  const remove = useCallback((id: string) => {
    controllers.current.get(id)?.abort()
    controllers.current.delete(id)
    pending.current.delete(id)
    setTasks((current) => {
      const task = current.find((item) => item.id === id)
      if (task?.previewUrl) URL.revokeObjectURL(task.previewUrl)
      return current.filter((item) => item.id !== id)
    })
  }, [])

  const upload = useCallback(
    async (id: string, file: File, durationSeconds?: number) => {
      const controller = new AbortController()
      controllers.current.set(id, controller)

      try {
        patch(id, { status: 'uploading', percent: 0 })

        const ticket = await mediaApi.requestUploadUrl({
          ownerType: 'child_profile',
          ownerId,
          kind,
          fileName: file.name,
          mimeType: file.type,
          sizeBytes: file.size,
        })
        patch(id, { mediaId: ticket.mediaId })

        await mediaApi.uploadToStorage(
          ticket.uploadUrl,
          file,
          (percent) => patch(id, { percent }),
          controller.signal,
        )
        patch(id, { status: 'completing', percent: 100 })

        // Длительность уходит на сервер — он проверяет лимит и ставит сжатие в очередь.
        const asset = await mediaApi.completeUpload(ticket.mediaId, { durationSeconds })
        patch(id, { status: 'done', mediaId: asset.id })
        releasePreview(id)
        void queryClient.invalidateQueries({ queryKey: profileMediaKey(ownerId) })
      } catch (error) {
        if (controller.signal.aborted) {
          patch(id, { status: 'canceled' })
          releasePreview(id)
          return
        }
        patch(id, {
          status: 'error',
          error: error instanceof Error ? error.message : 'Не удалось загрузить файл',
        })
        releasePreview(id)
      } finally {
        controllers.current.delete(id)
      }
    },
    [ownerId, kind, patch, releasePreview, queryClient],
  )

  const start = useCallback(
    async (file: File) => {
      // Формат и размер проверяем первыми — невалидный файл не должен выглядеть загружаемым.
      const validation = validateMediaFile(kind, file)
      if (!validation.ok) {
        setTasks((current) => [
          ...current,
          {
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            fileName: file.name,
            kind,
            sizeBytes: file.size,
            status: 'error',
            percent: 0,
            error: validation.message,
          },
        ])
        return
      }

      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
      const previewUrl = URL.createObjectURL(file)

      let durationSeconds: number | undefined

      if (kind === 'video') {
        try {
          durationSeconds = await readVideoDuration(file)
        } catch {
          // Не смогли прочитать метаданные — сервер всё равно проверит длительность.
        }
      }

      pending.current.set(id, { file, durationSeconds })

      // Та же проверка, что на сервере: файл дольше лимита он удалит.
      if (durationSeconds !== undefined && durationSeconds > MEDIA_LIMITS.maxVideoSeconds) {
        URL.revokeObjectURL(previewUrl)
        setTasks((current) => [
          ...current,
          {
            id,
            fileName: file.name,
            kind,
            sizeBytes: file.size,
            status: 'error',
            percent: 0,
            error: `Видео длиннее ${MEDIA_LIMITS.maxVideoSeconds} секунд`,
            durationSeconds,
          },
        ])
        return
      }

      setTasks((current) => [
        ...current,
        {
          id,
          fileName: file.name,
          kind,
          sizeBytes: file.size,
          status: 'uploading',
          percent: 0,
          previewUrl,
          durationSeconds,
        },
      ])

      if (kind === 'video') {
        try {
          const posterUrl = await captureVideoFrame(file)
          patch(id, { posterUrl: posterUrl ?? undefined })
        } catch {
          // Кадр-постер необязателен — галерея возьмёт первый кадр из видео.
        }
      }

      await upload(id, file, durationSeconds)
    },
    [kind, patch, upload],
  )

  const retry = useCallback(
    (id: string) => {
      // Берём файл и длительность из ref — замыкание могло остаться от прошлого рендера.
      const entry = pending.current.get(id)
      if (!entry) return

      // Превью освобождалось на терминальном статусе — пересоздаём для повтора.
      setTasks((current) =>
        current.map((task) =>
          task.id === id
            ? {
                ...task,
                status: 'uploading',
                percent: 0,
                error: undefined,
                previewUrl: URL.createObjectURL(entry.file),
              }
            : task,
        ),
      )

      void upload(id, entry.file, entry.durationSeconds)
    },
    [upload],
  )

  const cancel = useCallback(
    (id: string) => {
      controllers.current.get(id)?.abort()
      patch(id, { status: 'canceled' })
      releasePreview(id)
    },
    [patch, releasePreview],
  )

  return { tasks, start, cancel, retry, remove }
}
