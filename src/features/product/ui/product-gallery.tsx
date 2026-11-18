import { useState } from 'react'

import { renewMediaUrl, useMediaUrl } from '@/features/media/model/use-media-url'
import type { ProductMedia } from '@/shared/api/catalog-api'
import { Lightbox } from '@/shared/ui/lightbox/lightbox'
import { Skeleton } from '@/shared/ui/skeleton/skeleton'

interface ProductGalleryProps {
  title: string
  media: ProductMedia[]
}

// Галерея товара: главное медиа, миниатюры, зум фото, лайтбокс со стрелками клавиатурой.
export function ProductGallery({ title, media }: ProductGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [zoomed, setZoomed] = useState(false)

  const activeItem = media[activeIndex]
  const activeUrl = useMediaUrl(activeItem?.id)

  if (media.length === 0) {
    return (
      <div className="flex aspect-square items-center justify-center rounded-card border border-border bg-surface-muted text-sm text-text-muted">
        Фото пока нет
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="relative overflow-hidden rounded-card border border-border">
        {activeUrl ? (
          activeItem.kind === 'video' ? (
            <video
              src={activeUrl}
              controls
              preload="metadata"
              playsInline
              aria-label={`Видео товара «${title}»`}
              onError={() => void renewMediaUrl(activeItem.id)}
              className="aspect-square w-full bg-black object-contain"
            />
          ) : (
            <button
              type="button"
              className="block w-full min-h-11 cursor-zoom-in"
              onClick={() => setLightboxOpen(true)}
              aria-label="Открыть фото крупно"
            >
              <img
                src={activeUrl}
                alt={title}
                onError={() => void renewMediaUrl(activeItem.id)}
                className={`aspect-square w-full object-cover transition-transform ${zoomed ? 'scale-150' : ''}`}
              />
            </button>
          )
        ) : (
          <Skeleton className="aspect-square w-full rounded-none" />
        )}
        {/* Зум имеет смысл только для фото — у видео своя растяжка через controls. */}
        {activeItem.kind === 'photo' && (
          <button
            type="button"
            className="absolute bottom-2 right-2 min-h-11 rounded-md border border-border bg-surface px-3 text-sm"
            onClick={() => setZoomed((value) => !value)}
            aria-pressed={zoomed}
          >
            {zoomed ? 'Уменьшить' : 'Увеличить'}
          </button>
        )}
      </div>

      {/* Миниатюры — до 30 медиа товара */}
      {media.length > 1 && (
        <ul className="grid grid-cols-6 gap-2">
          {media.map((item, index) => (
            <li key={item.id}>
              <ThumbnailButton
                item={item}
                index={index}
                active={index === activeIndex}
                onClick={() => setActiveIndex(index)}
              />
            </li>
          ))}
        </ul>
      )}

      <Lightbox
        open={lightboxOpen}
        onOpenChange={setLightboxOpen}
        title={title}
        onPrev={() => setActiveIndex((index) => (index - 1 + media.length) % media.length)}
        onNext={() => setActiveIndex((index) => (index + 1) % media.length)}
      >
        {activeUrl &&
          (activeItem.kind === 'video' ? (
            <video
              src={activeUrl}
              controls
              preload="metadata"
              playsInline
              aria-label={`Видео товара «${title}»`}
              onError={() => void renewMediaUrl(activeItem.id)}
              className="max-h-[70vh] w-full bg-black object-contain"
            />
          ) : (
            <img
              src={activeUrl}
              alt={title}
              onError={() => void renewMediaUrl(activeItem.id)}
              className="max-h-[70vh] w-full object-contain"
            />
          ))}
      </Lightbox>
    </div>
  )
}

interface ThumbnailButtonProps {
  item: ProductMedia
  index: number
  active: boolean
  onClick: () => void
}

// Миниатюра медиа: фото картинкой, видео — первым кадром из самого файла.
function ThumbnailButton({ item, index, active, onClick }: ThumbnailButtonProps) {
  const url = useMediaUrl(item.id)
  const label = item.kind === 'video' ? `Видео ${index + 1}` : `Фото ${index + 1}`

  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active}
      aria-label={label}
      className={`block w-full overflow-hidden rounded-md border ${active ? 'border-primary' : 'border-border'}`}
    >
      {url ? (
        item.kind === 'video' ? (
          <video
            src={url}
            muted
            preload="metadata"
            playsInline
            aria-hidden="true"
            onError={() => void renewMediaUrl(item.id)}
            className="aspect-square w-full bg-black object-cover"
          />
        ) : (
          <img
            src={url}
            alt=""
            loading="lazy"
            onError={() => void renewMediaUrl(item.id)}
            className="aspect-square w-full object-cover"
          />
        )
      ) : (
        <Skeleton className="aspect-square w-full rounded-none" />
      )}
    </button>
  )
}