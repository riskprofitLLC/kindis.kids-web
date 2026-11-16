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

// Загрузка одного файла: превью → проверка → хранилище → фиксация.
export function useMediaUploads(ownerId: string, kind: MediaKind) {
  const [tasks, setTasks] = useState<UploadTask[]>([])
  const controllers = useRef(new Map<string, AbortController>())
  const files = useRef(new Map<string, File>())
  const queryClient = useQueryClient()

  const patch = useCallback((id: string, values: Partial<UploadTask>) => {
    setTasks((current) => current.map((task) => (task.id === id ? { ...task, ...values } : task)))
  }, [])

  const remove = useCallback((id: string) => {
    controllers.current.get(id)?.abort()
    controllers.current.delete(id)
    files.current.delete(id)
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
      patch(id, { status: 'uploading', percent: 0, error: undefined })

      try {
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
        const asset = await mediaApi.completeUpload(ticket.mediaId, {
          durationSeconds,
        })
        patch(id, { status: 'done', mediaId: asset.id })
        void queryClient.invalidateQueries({ queryKey: profileMediaKey(ownerId) })
      } catch (error) {
        if (controller.signal.aborted) {
          patch(id, { status: 'canceled' })
          return
        }
        patch(id, {
          status: 'error',
          error: error instanceof Error ? error.message : 'Не удалось загрузить файл',
        })
      } finally {
        controllers.current.delete(id)
      }
    },
    [ownerId, kind, patch, queryClient],
  )

  const start = useCallback(
    async (file: File) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
      const previewUrl = URL.createObjectURL(file)
      files.current.set(id, file)

      let durationSeconds: number | undefined

      if (kind === 'video') {
        try {
          durationSeconds = await readVideoDuration(file)
        } catch {
          // Не смогли прочитать метаданные — сервер всё равно проверит длительность.
        }
      }

      const task: UploadTask = {
        id,
        fileName: file.name,
        kind,
        sizeBytes: file.size,
        status: 'uploading',
        percent: 0,
        previewUrl,
        durationSeconds,
      }
      setTasks((current) => [...current, task])

      const validation = validateMediaFile(kind, file)
      if (!validation.ok) {
        patch(id, { status: 'error', error: validation.message })
        return
      }

      // Та же проверка, что на сервере: файл дольше лимита он удалит.
      if (durationSeconds !== undefined && durationSeconds > MEDIA_LIMITS.maxVideoSeconds) {
        patch(id, {
          status: 'error',
          error: `Видео длиннее ${MEDIA_LIMITS.maxVideoSeconds} секунд`,
        })
        return
      }

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
      const file = files.current.get(id)
      if (!file) return

      const task = tasks.find((item) => item.id === id)
      void upload(id, file, task?.durationSeconds)
    },
    [tasks, upload],
  )

  const cancel = useCallback(
    (id: string) => {
      controllers.current.get(id)?.abort()
      patch(id, { status: 'canceled' })
    },
    [patch],
  )

  return { tasks, start, cancel, retry, remove }
}
