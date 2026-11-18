import { useEffect, useState } from 'react'

import type { MediaAsset } from '@/shared/api/media-api'
import { MEDIA_STATUS_LABELS, mediaApi } from '@/shared/api/media-api'

// Ссылка на чтение для владельца: работает до прохождения модерации.
export function useOwnerUrl(mediaId: string): string | null {
  const [urls, setUrls] = useState<Record<string, string>>({})

  useEffect(() => {
    let active = true

    void mediaApi
      .getOwnerReadUrl(mediaId)
      .then((value) => {
        if (active) setUrls((current) => ({ ...current, [mediaId]: value }))
      })
      .catch(() => undefined)

    return () => {
      active = false
    }
  }, [mediaId])

  return urls[mediaId] ?? null
}

// Плитка галереи: фото картинкой, видео — первым кадром из самого файла.
export function MediaThumb({ asset }: { asset: MediaAsset }) {
  const url = useOwnerUrl(asset.id)

  if (!url) {
    return (
      <span className="flex aspect-square w-full items-center justify-center rounded bg-surface-muted px-2 text-center text-xs text-text-muted">
        {MEDIA_STATUS_LABELS[asset.status]}
      </span>
    )
  }

  if (asset.kind === 'photo') {
    return <img src={url} alt="" className="aspect-square w-full rounded object-cover" />
  }

  return (
    <video
      src={url}
      preload="metadata"
      muted
      playsInline
      aria-label="Видео профиля"
      className="aspect-square w-full rounded object-cover"
    />
  )
}

// Крупный просмотр в лайтбоксе: фото и плеер с обычной скоростью воспроизведения.
export function MediaViewer({ asset }: { asset: MediaAsset }) {
  const url = useOwnerUrl(asset.id)

  if (!url) {
    return (
      <p className="py-8 text-center text-sm text-text-muted">
        Файл ещё обрабатывается — он откроется через несколько секунд.
      </p>
    )
  }

  if (asset.kind === 'photo') {
    return (
      <img
        src={url}
        alt="Фото профиля крупно"
        className="max-h-[70vh] w-full rounded object-contain"
      />
    )
  }

  return (
    <video
      src={url}
      controls
      preload="metadata"
      playsInline
      className="max-h-[70vh] w-full rounded"
    >
      <track kind="captions" />
    </video>
  )
}
