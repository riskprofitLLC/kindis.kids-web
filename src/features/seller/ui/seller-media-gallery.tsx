import { useState } from 'react'

import { renewMediaUrl, useMediaUrl } from '@/features/media/model/use-media-url'
import type { MediaAsset } from '@/shared/api/media-api'
import { formatDuration } from '@/shared/domain/media'
import { Lightbox } from '@/shared/ui/lightbox/lightbox'

interface SellerMediaGalleryProps {
  media: MediaAsset[]
}

// Галерея витрины: фото ребёнка (до 5) и видео «как он делает».
export function SellerMediaGallery({ media }: SellerMediaGalleryProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const active = activeIndex === null ? null : media[activeIndex]

  if (media.length === 0) {
    return <p className="text-sm text-text-muted">Продавец пока не добавил фото и видео.</p>
  }

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-sm font-semibold text-text">Фото и видео мастера</h2>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {media.map((asset, index) => (
          <li key={asset.id}>
            <button
              type="button"
              className="block w-full min-h-11 text-left"
              onClick={() => setActiveIndex(index)}
            >
              <SellerMediaThumb asset={asset} />
            </button>
            {asset.durationSeconds !== null && (
              <p className="mt-1 text-xs text-text-muted">
                {formatDuration(asset.durationSeconds)}
              </p>
            )}
          </li>
        ))}
      </ul>

      <Lightbox
        open={active !== null}
        onOpenChange={(open) => !open && setActiveIndex(null)}
        title={active?.kind === 'video' ? 'Видео «как он делает»' : 'Фото мастера'}
        onPrev={() =>
          setActiveIndex((current) =>
            current === null ? null : (current - 1 + media.length) % media.length,
          )
        }
        onNext={() =>
          setActiveIndex((current) => (current === null ? null : (current + 1) % media.length))
        }
      >
        {active && <SellerMediaViewer asset={active} />}
      </Lightbox>
    </section>
  )
}

function SellerMediaThumb({ asset }: { asset: MediaAsset }) {
  const url = useMediaUrl(asset.id)

  if (!url) {
    return <div className="aspect-square rounded bg-surface-muted" aria-hidden="true" />
  }

  if (asset.kind === 'photo') {
    return (
      <img
      src={url}
      alt=""
      loading="lazy"
      onError={() => void renewMediaUrl(asset.id)}
      className="aspect-square w-full rounded object-cover"
    />
    )
  }

  // Видео — постер-кадр не делаем:браузер возьмёт первый кадр сам.
  return (
    <video
      src={url}
      preload="metadata"
      onError={() => void renewMediaUrl(asset.id)}
      className="aspect-square w-full rounded object-cover"
    />
  )
}

function SellerMediaViewer({ asset }: { asset: MediaAsset }) {
  const url = useMediaUrl(asset.id)

  if (!url) {
    return <p className="py-8 text-center text-sm text-text-muted">Файл обрабатывается…</p>
  }

  if (asset.kind === 'video') {
    // Обычная скорость воспроизведения по умолчанию — спецэффекты не нужны.
    return (
      <video
        src={url}
        controls
        className="max-h-[70vh] w-full"
        onRateChange={(event) => {
          if (event.currentTarget.playbackRate !== 1) event.currentTarget.playbackRate = 1
        }}
      />
    )
  }

  return (
    <img
      src={url}
      alt=""
      onError={() => void renewMediaUrl(asset.id)}
      className="max-h-[70vh] w-full object-contain"
    />
  )
}
