import { useRef, useState } from 'react'

import { type UploadTask, useMediaUploads } from '@/features/child-profile/model/use-media-uploads'
import type { MediaKind } from '@/shared/domain/media'
import { formatDuration, formatFileSize } from '@/shared/domain/media'
import { Button } from '@/shared/ui/button/button'
import { Progress } from '@/shared/ui/progress/progress'

interface MediaUploaderProps {
  ownerId: string
  kind: MediaKind
  limit?: number
  currentCount?: number
}

const ACCEPT: Record<MediaKind, string> = {
  photo: 'image/jpeg,image/png,image/webp',
  video: 'video/mp4,video/webm',
}

const STATUS_TEXT: Record<UploadTask['status'], string> = {
  uploading: 'Загружаем',
  completing: 'Обрабатывается',
  done: 'Готово',
  error: 'Ошибка',
  canceled: 'Отменено',
}

// Превью выбранного файла: фото картинкой, видео — постером и проигрывателем.
function TaskPreview({ task }: { task: UploadTask }) {
  if (!task.previewUrl) return null

  if (task.kind === 'photo') {
    return <img src={task.previewUrl} alt="" className="h-12 w-12 rounded object-cover" />
  }

  return (
    <video
      src={task.previewUrl}
      poster={task.posterUrl}
      preload="metadata"
      muted
      playsInline
      controls
      aria-label={`Превью: ${task.fileName}`}
      className="h-16 w-28 rounded bg-black object-contain"
    />
  )
}

// Зона загрузки с drag-and-drop, выбором файла, прогрессом, отменой и повтором
export function MediaUploader({ ownerId, kind, limit, currentCount = 0 }: MediaUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const { tasks, start, cancel, retry, remove } = useMediaUploads(ownerId, kind)

  const full = limit !== undefined && currentCount + tasks.length >= limit

  const handleFiles = (fileList: FileList | null) => {
    if (!fileList) return
    for (const file of Array.from(fileList)) {
      void start(file)
    }
  }

  return (
    <section className="flex flex-col gap-3">
      <div
        onDragOver={(event) => {
          event.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault()
          setDragging(false)
          if (!full) handleFiles(event.dataTransfer.files)
        }}
        className={`rounded-card border border-dashed p-6 text-center ${
          dragging ? 'border-primary bg-surface-muted' : 'border-border'
        }`}
      >
        <p className="text-sm text-text">Перетащите {kind === 'photo' ? 'фото' : 'видео'} сюда</p>
        <p className="mt-1 text-xs text-text-muted">
          или выберите файл с устройства
          {limit !== undefined && ` — не больше ${limit}`}
        </p>

        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-3"
          disabled={full}
          onClick={() => inputRef.current?.click()}
        >
          Выбрать файл
        </Button>

        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT[kind]}
          multiple={kind === 'photo'}
          className="sr-only"
          onChange={(event) => {
            handleFiles(event.target.files)
            event.target.value = ''
          }}
        />
      </div>

      {full && (
        <p className="text-sm text-text-muted">
          Достигнут лимит: удалите файл, чтобы загрузить новый.
        </p>
      )}

      <ul aria-live="polite" className="flex flex-col gap-2">
        {tasks.map((task) => (
          <li key={task.id} className="rounded-card border border-border p-3">
            <div className="flex items-center gap-3">
              <TaskPreview task={task} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-text">{task.fileName}</p>
                <p className="text-xs text-text-muted">
                  {formatFileSize(task.sizeBytes)}
                  {task.durationSeconds !== undefined &&
                    ` · ${formatDuration(task.durationSeconds)}`}
                  {` · ${STATUS_TEXT[task.status]}`}
                  {task.status === 'uploading' && ` ${task.percent}%`}
                </p>
              </div>

              {(task.status === 'uploading' || task.status === 'completing') && (
                <Button type="button" variant="ghost" size="sm" onClick={() => cancel(task.id)}>
                  Отмена
                </Button>
              )}

              {(task.status === 'error' || task.status === 'canceled') && (
                <Button type="button" variant="outline" size="sm" onClick={() => retry(task.id)}>
                  Повторить
                </Button>
              )}

              <Button type="button" variant="ghost" size="sm" onClick={() => remove(task.id)}>
                Убрать
              </Button>
            </div>

            {(task.status === 'uploading' || task.status === 'completing') && (
              <Progress
                className="mt-2"
                value={task.status === 'completing' ? 100 : task.percent}
                label={`Загрузка ${task.fileName}`}
              />
            )}

            {task.error && <p className="mt-2 text-xs text-danger">{task.error}</p>}
          </li>
        ))}
      </ul>
    </section>
  )
}
